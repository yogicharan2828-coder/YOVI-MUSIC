from fastapi import APIRouter, HTTPException, Query

from app.services.music.youtube import youtube_service
from app.services.music.itunes import itunes_service
from app.services.music.deezer import deezer_service


router = APIRouter(
    prefix="/music",
    tags=["Music"],
)


# ============================================================
# MUSIC SEARCH
# ============================================================

@router.get("/search")
async def search_music(
    q: str = Query(
        ...,
        min_length=1,
        max_length=200,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
):
    """
    Search music across iTunes and Deezer.

    Results are normalized into YOVI's common
    song format.
    """

    query = q.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty",
        )

    results = []


    # ========================================================
    # iTUNES
    # ========================================================

    try:

        data = await itunes_service.search_songs(
            query=query,
            limit=limit,
        )

        for item in data.get("results", []):

            results.append(
                {
                    "id": str(
                        item.get("trackId")
                    ),

                    "title": item.get(
                        "trackName"
                    ),

                    "artist": item.get(
                        "artistName"
                    ),

                    "album": item.get(
                        "collectionName"
                    ),

                    "image": item.get(
                        "artworkUrl100"
                    ),

                    "provider": "itunes",

                    "duration": item.get(
                        "trackTimeMillis"
                    ),

                    "preview_url": item.get(
                        "previewUrl"
                    ),

                    "external_url": item.get(
                        "trackViewUrl"
                    ),
                }
            )

    except Exception as exc:

        print(
            f"iTunes search failed: {exc}"
        )


    # ========================================================
    # DEEZER
    # ========================================================

    try:

        data = await deezer_service.search_tracks(
            query=query,
            limit=limit,
        )

        for item in data.get("data", []):

            artist_data = item.get(
                "artist",
                {}
            )

            album_data = item.get(
                "album",
                {}
            )

            results.append(
                {
                    "id": str(
                        item.get("id")
                    ),

                    "title": item.get(
                        "title"
                    ),

                    "artist": artist_data.get(
                        "name"
                    ),

                    "album": album_data.get(
                        "title"
                    ),

                    "image": (
                        album_data.get(
                            "cover_medium"
                        )
                        or album_data.get(
                            "cover"
                        )
                    ),

                    "provider": "deezer",

                    "duration": (
                        item.get("duration")
                    ),

                    "preview_url": item.get(
                        "preview"
                    ),

                    "external_url": item.get(
                        "link"
                    ),
                }
            )

    except Exception as exc:

        print(
            f"Deezer search failed: {exc}"
        )


    # ========================================================
    # REMOVE INVALID RESULTS
    # ========================================================

    results = [
        song
        for song in results
        if song.get("title")
        and song.get("artist")
    ]


    return {
        "query": query,
        "count": len(results),
        "results": results,
    }


# ============================================================
# YOUTUBE SEARCH
# ============================================================

@router.get("/youtube/search")
async def search_youtube_song(
    title: str = Query(
        ...,
        min_length=1,
    ),
    artist: str = Query(
        ...,
        min_length=1,
    ),
):

    try:

        results = await youtube_service.search_song(
            title=title,
            artist=artist,
        )

        return {
            "query": f"{title} {artist}",
            "count": len(results),
            "results": results,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"YouTube search failed: {str(exc)}",
        )


# ============================================================
# YOUTUBE HEALTH
# ============================================================

@router.get("/youtube/health")
async def youtube_health():

    return {
        "status": "ok",
        "service": "youtube",
    }