from fastapi import APIRouter, HTTPException, Query

from app.schemas.youtube import YouTubeSearchResponse
from app.services.music.youtube import (
    YouTubeQuotaExceeded,
    youtube_service,
)
from app.services.youtube_normalizer import (
    normalize_youtube_result,
)


router = APIRouter(
    prefix="/youtube",
    tags=["YouTube"],
)


@router.get(
    "/search",
    response_model=YouTubeSearchResponse,
)
async def search_youtube(
    q: str = Query(
        ...,
        min_length=1,
        max_length=200,
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
    ),
):

    try:
        data = await youtube_service.search_videos(
            query=q,
            limit=limit,
            region_code="IN",
        )

        results = [
            normalize_youtube_result(item)
            for item in data.get("items", [])
            if item.get("id", {}).get("videoId")
        ]

        return YouTubeSearchResponse(
            query=q.strip(),
            count=len(results),
            results=results,
        )

    except YouTubeQuotaExceeded:
        # Quota exhaustion is not a gateway failure. Return a valid empty
        # search response so the frontend can continue normal audio/UI flow.
        return YouTubeSearchResponse(
            query=q.strip(),
            count=0,
            results=[],
        )

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"YouTube API error: {str(e)}",
        )
