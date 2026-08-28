from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import decode_access_token

from app.database.connection import get_db

from app.models.listening_event import ListeningEvent
from app.models.user import User

from app.schemas.listening import (
    ListeningEventCreate,
    ListeningEventResponse,
    ListeningHistoryResponse,
    ListeningProfileResponse,
)

from app.services.personalization import (
    build_listening_profile,
)


router = APIRouter(
    prefix="/listening",
    tags=["Listening & Personalization"],
)


# ============================================================
# OPTIONAL AUTHENTICATION
# ============================================================

optional_security = HTTPBearer(
    auto_error=False,
)


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        optional_security
    ),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Return the authenticated user when a valid JWT exists.

    If no Authorization header is provided, return None so
    anonymous/device-based listening continues to work.
    """

    if credentials is None:
        return None

    payload = decode_access_token(
        credentials.credentials
    )

    if payload is None:
        return None

    user_id = payload.get("sub")

    if user_id is None:
        return None

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )

    return user


# ============================================================
# RECORD LISTENING EVENT
# ============================================================

@router.post(
    "/events",
    response_model=ListeningEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listening_event(
    event_data: ListeningEventCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(
        get_optional_user
    ),
):
    """
    Record one meaningful song interaction.

    Authenticated users:
        event is attached to their user_id.

    Anonymous users:
        event remains device-based using device_id.
    """

    event = ListeningEvent(

        # ----------------------------------------------------
        # USER ID
        # ----------------------------------------------------
        #
        # Logged-in user -> actual account ID.
        # Anonymous user -> None.
        #
        user_id=(
            current_user.id
            if current_user
            else None
        ),

        # ----------------------------------------------------
        # DEVICE ID
        # ----------------------------------------------------
        #
        # Keep device_id as well so anonymous listening
        # continues to work exactly as before.
        #
        device_id=(
            event_data.device_id.strip()
            if event_data.device_id
            else None
        ),

        # ----------------------------------------------------
        # LOCAL SONG ID
        # ----------------------------------------------------

        song_id=event_data.song_id,

        # ----------------------------------------------------
        # EXTERNAL PROVIDER
        # ----------------------------------------------------

        external_id=event_data.external_id,

        external_source=event_data.external_source,

        # ----------------------------------------------------
        # SONG METADATA
        # ----------------------------------------------------

        title=(
            event_data.title.strip()
            if event_data.title
            else ""
        ),

        artist=(
            event_data.artist.strip()
            if event_data.artist
            else None
        ),

        album=(
            event_data.album.strip()
            if event_data.album
            else None
        ),

        language=(
            event_data.language.strip()
            if event_data.language
            else None
        ),

        genre=(
            event_data.genre.strip()
            if event_data.genre
            else None
        ),

        mood=(
            event_data.mood.strip()
            if event_data.mood
            else None
        ),
              image=(
            event_data.image.strip()
            if event_data.image
            else None
        ),

        cover_url=(
            event_data.cover_url.strip()
            if event_data.cover_url
            else None
        ),

        # ----------------------------------------------------
        # PLAYBACK EVENT
        # ----------------------------------------------------

        event_type=event_data.event_type,

        position_seconds=(
            event_data.position_seconds
        ),

        duration_seconds=(
            event_data.duration_seconds
        ),
    )


    db.add(event)

    db.commit()

    db.refresh(event)


    return event


# ============================================================
# LISTENING HISTORY
# ============================================================

@router.get(
    "/history",
    response_model=ListeningHistoryResponse,
)
def get_listening_history(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Authenticated listening history.

    Only events belonging to the currently
    authenticated user are returned.
    """

    events = (
        db.query(ListeningEvent)
        .filter(
            ListeningEvent.user_id
            == current_user.id
        )
        .order_by(
            ListeningEvent.created_at.desc()
        )
        .limit(limit)
        .all()
    )


    return {
        "count": len(events),
        "results": events,
    }


# ============================================================
# AUTHENTICATED LISTENING PROFILE
# ============================================================

@router.get(
    "/profile",
    response_model=ListeningProfileResponse,
)
def get_listening_profile(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Build a personalization profile for
    the authenticated user.
    """

    return build_listening_profile(
        db=db,
        user_id=current_user.id,
    )


# ============================================================
# ANONYMOUS DEVICE LISTENING PROFILE
# ============================================================

@router.get(
    "/profile/device/{device_id}",
    response_model=ListeningProfileResponse,
)
def get_device_listening_profile(
    device_id: str,
    db: Session = Depends(get_db),
):
    """
    Build a personalization profile for
    an anonymous device.
    """

    clean_device_id = device_id.strip()


    if not clean_device_id:

        return {
            "total_events": 0,
            "total_plays": 0,
            "total_completions": 0,
            "languages": [],
            "genres": [],
            "moods": [],
            "artists": [],
        }


    return build_listening_profile(
        db=db,
        device_id=clean_device_id,
    )