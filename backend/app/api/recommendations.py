from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.recommendations import (
    build_recommendations,
)


router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
)


# ============================================================
# ANONYMOUS DEVICE RECOMMENDATIONS
# ============================================================

@router.get(
    "/device/{device_id}",
)
async def get_device_recommendations(
    device_id: str,
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
    db: Session = Depends(get_db),
):
    """
    Generate personalized recommendations for an
    anonymous YOVI device.
    """

    clean_device_id = (
        device_id.strip()
    )


    if not clean_device_id:

        return {
            "mode": "discovery",
            "profile": {
                "total_events": 0,
                "total_plays": 0,
                "total_completions": 0,
                "languages": [],
                "genres": [],
                "moods": [],
                "artists": [],
            },
            "count": 0,
            "results": [],
        }


    return await build_recommendations(
        db=db,
        device_id=clean_device_id,
        limit=limit,
    )