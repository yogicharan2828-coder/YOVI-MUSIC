from fastapi import APIRouter, HTTPException, Query

from app.services.lyrics import lyrics_service


router = APIRouter(
    prefix="/lyrics",
    tags=["Lyrics"],
)


@router.get("/search")
async def get_lyrics(
    title: str = Query(
        ...,
        min_length=1,
        max_length=200,
    ),

    artist: str = Query(
        ...,
        min_length=1,
        max_length=200,
    ),

    album: str | None = Query(
        default=None,
        max_length=200,
    ),

    duration: float | None = Query(
        default=None,
        gt=0,
        le=300000,
    ),
):

    try:

        normalized_duration = duration


        # ======================================================
        # NORMALIZE DURATION
        # ======================================================

        # iTunes commonly gives milliseconds.
        # LRCLIB expects seconds.

        if (
            normalized_duration
            and normalized_duration > 10000
        ):

            normalized_duration = (
                normalized_duration / 1000
            )


        # ======================================================
        # GET LYRICS
        # ======================================================

        lyrics = await lyrics_service.get_lyrics(
            title=title,
            artist=artist,
            album=album,
            duration=normalized_duration,
        )


        # ======================================================
        # NOT FOUND
        # ======================================================

        if not lyrics:

            return {
                "found": False,
                "title": title,
                "artist": artist,
                "album": album,
                "duration": normalized_duration,
                "plainLyrics": None,
                "syncedLyrics": None,
            }


        # ======================================================
        # SUCCESS
        # ======================================================

        return {
            "found": True,

            "title": lyrics.get(
                "trackName"
            ),

            "artist": lyrics.get(
                "artistName"
            ),

            "album": lyrics.get(
                "albumName"
            ),

            "duration": lyrics.get(
                "duration"
            ),

            "instrumental": lyrics.get(
                "instrumental",
                False,
            ),

            "plainLyrics": lyrics.get(
                "plainLyrics"
            ),

            "syncedLyrics": lyrics.get(
                "syncedLyrics"
            ),
        }


    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"Lyrics search failed: {str(exc)}",
        )