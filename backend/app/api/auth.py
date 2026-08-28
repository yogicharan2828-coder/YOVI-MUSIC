import secrets
import time

import httpx

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import RedirectResponse

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.database.connection import get_db
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# GOOGLE OAUTH STATE
# ============================================================

_google_states = {}

GOOGLE_STATE_TTL_SECONDS = 10 * 60


# ============================================================
# GOOGLE STATE CLEANUP
# ============================================================

def _cleanup_google_states():
    now = time.time()

    expired_states = [
        state
        for state, created_at in _google_states.items()
        if now - created_at > GOOGLE_STATE_TTL_SECONDS
    ]

    for state in expired_states:
        _google_states.pop(
            state,
            None,
        )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(
            or_(
                User.email == user_data.email,
                User.username == user_data.username,
            )
        )
        .first()
    )

    if existing_user:

        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )

    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(
            user_data.password
        ),
        display_name=user_data.display_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            User.email == user_data.email
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(
        user_data.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


# ============================================================
# GOOGLE LOGIN
# ============================================================

@router.get(
    "/google",
)
def google_login():

    _cleanup_google_states()

    state = secrets.token_urlsafe(32)

    _google_states[state] = time.time()

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }

    google_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + str(
            httpx.QueryParams(params)
        )
    )

    return RedirectResponse(
        url=google_url,
        status_code=302,
    )


# ============================================================
# GOOGLE CALLBACK
# ============================================================

@router.get(
    "/google/callback",
)
async def google_callback(
    code: str | None = Query(
        default=None
    ),
    state: str | None = Query(
        default=None
    ),
    error: str | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # GOOGLE CANCELLED
    # --------------------------------------------------------

    if error:

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?google_error=cancelled"
            )
        )

    # --------------------------------------------------------
    # VALIDATE RESPONSE
    # --------------------------------------------------------

    if not code or not state:

        raise HTTPException(
            status_code=400,
            detail="Invalid Google authentication response.",
        )

    # --------------------------------------------------------
    # VALIDATE STATE
    # --------------------------------------------------------

    created_at = _google_states.pop(
        state,
        None,
    )

    if created_at is None:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired Google authentication state.",
        )

    if (
        time.time() - created_at
        > GOOGLE_STATE_TTL_SECONDS
    ):

        raise HTTPException(
            status_code=400,
            detail="Google authentication session expired.",
        )

    # --------------------------------------------------------
    # EXCHANGE CODE FOR TOKEN
    # --------------------------------------------------------

    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(
        timeout=15.0
    ) as client:

        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data=token_data,
        )

    if not token_response.is_success:

        print(
            "YOVI Google token exchange failed:",
            token_response.text,
        )

        raise HTTPException(
            status_code=400,
            detail="Unable to authenticate with Google.",
        )

    tokens = token_response.json()

    google_access_token = tokens.get(
        "access_token"
    )

    if not google_access_token:

        raise HTTPException(
            status_code=400,
            detail="Google did not return an access token.",
        )

    # --------------------------------------------------------
    # GET GOOGLE USER INFO
    # --------------------------------------------------------

    async with httpx.AsyncClient(
        timeout=15.0
    ) as client:

        userinfo_response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={
                "Authorization":
                    f"Bearer {google_access_token}",
            },
        )

    if not userinfo_response.is_success:

        print(
            "YOVI Google userinfo failed:",
            userinfo_response.text,
        )

        raise HTTPException(
            status_code=400,
            detail="Unable to retrieve Google account information.",
        )

    google_user = userinfo_response.json()

    google_id = google_user.get(
        "sub"
    )

    email = google_user.get(
        "email"
    )

    email_verified = google_user.get(
        "email_verified",
        False,
    )

    display_name = google_user.get(
        "name"
    )

    avatar_url = google_user.get(
        "picture"
    )

    if not google_id or not email:

        raise HTTPException(
            status_code=400,
            detail="Google account information is incomplete.",
        )

    if not email_verified:

        raise HTTPException(
            status_code=400,
            detail="Google email address is not verified.",
        )

    # --------------------------------------------------------
    # FIND BY GOOGLE ID
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.google_id == google_id
        )
        .first()
    )

    # --------------------------------------------------------
    # FIND BY EMAIL
    # --------------------------------------------------------

    if user is None:

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

    # --------------------------------------------------------
    # EXISTING USER
    # --------------------------------------------------------

    if user is not None:

        if user.google_id is None:

            user.google_id = google_id

        if not user.avatar_url:

            user.avatar_url = avatar_url

        if not user.display_name:

            user.display_name = display_name

        db.commit()
        db.refresh(user)

    # --------------------------------------------------------
    # NEW GOOGLE USER
    # --------------------------------------------------------

    else:

        base_username = email.split(
            "@"
        )[0]

        base_username = "".join(
            character
            for character in base_username
            if character.isalnum()
            or character == "_"
        )

        base_username = base_username[:40]

        if len(base_username) < 3:

            base_username = "yoviuser"

        username = base_username

        counter = 1

        while (
            db.query(User)
            .filter(
                User.username == username
            )
            .first()
            is not None
        ):

            suffix = str(counter)

            username = (
                f"{base_username[:40 - len(suffix)]}"
                f"{suffix}"
            )

            counter += 1

        random_password = secrets.token_urlsafe(
            32
        )

        user = User(
            email=email,
            username=username,
            google_id=google_id,
            password_hash=hash_password(
                random_password
            ),
            display_name=display_name,
            avatar_url=avatar_url,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    # --------------------------------------------------------
    # ACCOUNT STATUS
    # --------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    # --------------------------------------------------------
    # CREATE YOVI JWT
    # --------------------------------------------------------

    yovi_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    # --------------------------------------------------------
    # REDIRECT TO REACT
    # --------------------------------------------------------

    frontend_url = (
        f"{settings.FRONTEND_URL}"
        f"/auth/callback"
        f"#token={yovi_token}"
    )

    return RedirectResponse(
        url=frontend_url,
        status_code=302,
    )