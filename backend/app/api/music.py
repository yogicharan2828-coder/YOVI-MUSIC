import asyncio

from fastapi import APIRouter, HTTPException, Query

from app.services.music.jiosaavan import (
    jiosaavn_service,
)

from app.services.music.itunes import (
    itunes_service,
)

from app.services.music.youtube import (
    youtube_service,
)


router = APIRouter(
    prefix="/music",
    tags=["Music"],
)


# ============================================================
# HELPERS
# ============================================================

def normalize_text(
    value,
) -> str:

    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


def normalize_itunes_song(
    item: dict,
) -> dict | None:

    if not isinstance(
        item,
        dict,
    ):
        return None


    title = (
        item.get("trackName")
        or ""
    ).strip()


    artist = (
        item.get("artistName")
        or ""
    ).strip()


    if not title or not artist:

        return None


    duration = None


    try:

        duration_ms = item.get(
            "trackTimeMillis"
        )


        if duration_ms is not None:

            duration = (
                int(duration_ms)
                // 1000
            )


    except (
        TypeError,
        ValueError,
    ):

        duration = None


    return {

        "id":
            str(
                item.get(
                    "trackId"
                )
                or ""
            ),

        "title":
            title,

        "artist":
            artist,

        "album":
            (
                item.get(
                    "collectionName"
                )
                or ""
            ),

        "provider":
            "itunes",

        "image":
            item.get(
                "artworkUrl100"
            ),

        "duration":
            duration,

        "preview_url":
            item.get(
                "previewUrl"
            ),

        "external_url":
            item.get(
                "trackViewUrl"
            ),

        "album_id":
            str(
                item.get(
                    "collectionId"
                )
                or ""
            ),

        "language":
            None,

        "release_date":
            item.get(
                "releaseDate"
            ),

    }


def song_dedupe_key(
    song: dict,
) -> str:

    title = normalize_text(
        song.get("title")
    )

    artist = normalize_text(
        song.get("artist")
    )


    return (
        f"{title}|{artist}"
    )


def merge_music_results(
    jiosaavn_results: list,
    itunes_results: list,
    limit: int,
) -> list:

    merged = []

    seen = set()


    # --------------------------------------------------------
    # JIOSAAVN FIRST
    #
    # JioSaavn is our preferred music provider.
    # Its results are therefore added first.
    # --------------------------------------------------------

    for song in jiosaavn_results:

        if not isinstance(
            song,
            dict,
        ):
            continue


        if not song.get(
            "title"
        ):

            continue


        if not song.get(
            "artist"
        ):

            continue


        key = song_dedupe_key(
            song
        )


        if key in seen:

            continue


        seen.add(
            key
        )


        merged.append(
            song
        )


    # --------------------------------------------------------
    # ITUNES FILLS THE GAPS
    # --------------------------------------------------------

    for song in itunes_results:

        if len(
            merged
        ) >= limit:

            break


        if not isinstance(
            song,
            dict,
        ):
            continue


        if not song.get(
            "title"
        ):

            continue


        if not song.get(
            "artist"
        ):

            continue


        key = song_dedupe_key(
            song
        )


        if key in seen:

            continue


        seen.add(
            key
        )


        merged.append(
            song
        )


    return merged[
        :limit
    ]


# ============================================================
# MUSIC SEARCH — JIOSAAVN + ITUNES
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
    Search music using JioSaavn and iTunes
    concurrently.

    JioSaavn results are preferred when duplicate
    songs exist. iTunes fills results that JioSaavn
    does not provide.

    Failure of either provider does not fail the
    complete search.
    """

    query = q.strip()


    if not query:

        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty",
        )


    # ========================================================
    # PROVIDER LIMIT
    # ========================================================

    # Don't request 20-50 songs from both providers
    # when the frontend normally needs only a small
    # number of results.

    provider_limit = min(
        max(
            limit,
            6,
        ),
        10,
    )


    # ========================================================
    # RUN PROVIDERS IN PARALLEL
    # ========================================================

    jiosaavn_task = asyncio.create_task(

        jiosaavn_service.search_songs(

            query=query,

            limit=provider_limit,

        )

    )


    itunes_task = asyncio.create_task(

        itunes_service.search_songs(

            query=query,

            limit=provider_limit,

        )

    )


    (
        jiosaavn_response,
        itunes_response,
    ) = await asyncio.gather(

        jiosaavn_task,

        itunes_task,

        return_exceptions=True,

    )


    # ========================================================
    # JIOSAAVN RESULTS
    # ========================================================

    jiosaavn_results = []


    if isinstance(
        jiosaavn_response,
        list,
    ):

        jiosaavn_results = [

            song

            for song
            in jiosaavn_response

            if isinstance(
                song,
                dict,
            )

            and song.get(
                "title"
            )

            and song.get(
                "artist"
            )

        ]


    else:

        print(
            "[JioSaavn search failed]",
            jiosaavn_response,
        )


    # ========================================================
    # ITUNES RESULTS
    # ========================================================

    itunes_results = []


    if isinstance(
        itunes_response,
        dict,
    ):

        raw_results = (
            itunes_response.get(
                "results",
                [],
            )
        )


        if isinstance(
            raw_results,
            list,
        ):

            for item in raw_results:

                normalized = (
                    normalize_itunes_song(
                        item
                    )
                )


                if normalized:

                    itunes_results.append(
                        normalized
                    )


    else:

        print(
            "[iTunes search failed]",
            itunes_response,
        )


    # ========================================================
    # MERGE
    # ========================================================

    results = merge_music_results(

        jiosaavn_results=
            jiosaavn_results,

        itunes_results=
            itunes_results,

        limit=limit,

    )


    # ========================================================
    # LOGGING
    # ========================================================

    print(
        "[Music search]",
        {

            "query":
                query,

            "jiosaavn":
                len(
                    jiosaavn_results
                ),

            "itunes":
                len(
                    itunes_results
                ),

            "merged":
                len(
                    results
                ),

        },
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "query":
            query,

        "count":
            len(
                results
            ),

        "results":
            results,

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

        results = (
            await youtube_service.search_song(
                title=title,
                artist=artist,
            )
        )


        return {

            "query":
                f"{title} {artist}",

            "count":
                len(
                    results
                ),

            "results":
                results,

        }


    except Exception as exc:

        raise HTTPException(

            status_code=502,

            detail=(
                "YouTube search failed: "
                f"{str(exc)}"
            ),

        )


# ============================================================
# YOUTUBE HEALTH
# ============================================================

@router.get("/youtube/health")
async def youtube_health():

    return {

        "status":
            "ok",

        "service":
            "youtube",

    }