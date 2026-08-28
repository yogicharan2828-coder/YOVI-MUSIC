from fastapi import APIRouter, HTTPException

from app.database.connection import SessionLocal
from app.services.explore import build_explore


router = APIRouter(
    prefix="/explore",
    tags=["Explore"],
)


# ============================================================
# DYNAMIC EXPLORE
# ============================================================

@router.get("/device/{device_id}")
async def get_device_explore(
    device_id: str,
):
    """
    Return the complete dynamic Explore experience
    for an anonymous YOVI device.
    """

    clean_device_id = (
        device_id.strip()
    )


    if not clean_device_id:

        raise HTTPException(
            status_code=400,
            detail="Device ID cannot be empty",
        )


    db = SessionLocal()


    try:

        return await build_explore(
            db=db,
            device_id=clean_device_id,
        )

    except Exception as exc:

        print(
            f"Explore generation failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to build Explore recommendations",
        )

    finally:

        db.close()