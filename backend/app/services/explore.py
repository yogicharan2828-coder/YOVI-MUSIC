from app.models.listening_event import ListeningEvent

from app.services.recommendations import (
    build_recommendations,
)

from app.services.music.itunes import (
    itunes_service,
)

from app.services.music.deezer import (
    deezer_service,
)

from app.services.explore_cache import (
    get_stable,
    set_stable,
    get_personalized,
    set_personalized,
)


# ============================================================
# CONFIGURATION
# ============================================================

# Temporary testing limit.
# We can increase this to 15-20 after Explore is stable.
SECTION_LIMIT = 5

# Never request more than this from one provider.
PROVIDER_LIMIT = 5

# Made For You only refreshes after 10 new meaningful events.
PERSONALIZATION_REFRESH_EVENTS = 10


# ============================================================
# LANGUAGE QUERIES
# ============================================================

LANGUAGE_QUERIES = {
    "Telugu": [
        "Telugu songs",
        "Telugu hit songs",
    ],

    "Hindi": [
        "Hindi songs",
        "Bollywood Hindi songs",
    ],

    "Tamil": [
        "Tamil songs",
        "Tamil hit songs",
    ],

    "Kannada": [
        "Kannada songs",
        "Kannada hit songs",
    ],

    "Malayalam": [
        "Malayalam songs",
        "Malayalam hit songs",
    ],

    "English": [
        "English pop songs",
        "English hit songs",
    ],
}


# ============================================================
# MOODS
# ============================================================

MOOD_QUERIES = {
    "Happy": "happy songs",
    "Chill": "chill songs",
    "Romantic": "romantic songs",
    "Energetic": "energetic songs",
    "Sad": "sad songs",
    "Focus": "focus music",
}


# ============================================================
# ACTIVITIES
# ============================================================

ACTIVITY_QUERIES = {
    "Gym": "gym workout songs",
    "Focus": "study focus music",
    "Chill": "relax chill music",
    "Party": "party songs",
    "Romantic": "romantic songs",
    "Travel": "travel songs",
}


# ============================================================
# NORMALIZE ITUNES
# ============================================================

def _normalize_itunes(item):

    track_id = item.get("trackId")

    if track_id is None:
        return None

    return {
        "id": str(track_id),

        "title": item.get("trackName"),

        "artist": item.get("artistName"),

        "album": item.get("collectionName"),

        "image": (
            item.get("artworkUrl600")
            or item.get("artworkUrl100")
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


# ============================================================
# NORMALIZE DEEZER
# ============================================================

def _normalize_deezer(item):

    item_id = item.get("id")

    if item_id is None:
        return None

    artist_data = (
        item.get("artist")
        or {}
    )

    album_data = (
        item.get("album")
        or {}
    )

    return {
        "id": str(item_id),

        "title": item.get("title"),

        "artist": artist_data.get("name"),

        "album": album_data.get("title"),

        "image": (
            album_data.get("cover_medium")
            or album_data.get("cover")
        ),

        "provider": "deezer",

        "duration": item.get("duration"),

        "preview_url": item.get("preview"),

        "external_url": item.get("link"),
    }


# ============================================================
# VALID SONG
# ============================================================

def _valid(song):

    if not song:
        return False

    return bool(
        song.get("id")
        and song.get("title")
        and song.get("artist")
    )


# ============================================================
# SONG KEY
# ============================================================

def _song_key(song):

    title = str(
        song.get("title") or ""
    ).strip().lower()

    artist = str(
        song.get("artist") or ""
    ).strip().lower()

    return f"{title}::{artist}"


# ============================================================
# ADD UNIQUE SONG
# ============================================================

def _append_unique(
    songs,
    song,
    used_keys,
):

    if not _valid(song):
        return False

    key = _song_key(song)

    if not key:
        return False

    if key in used_keys:
        return False

    used_keys.add(key)

    songs.append(song)

    return True


# ============================================================
# PROVIDER SEARCH
# ============================================================

async def _search(
    query,
    *,
    limit=SECTION_LIMIT,
    used_keys=None,
):

    if used_keys is None:
        used_keys = set()

    songs = []

    # ========================================================
    # ITUNES
    # ========================================================

    try:

        data = await itunes_service.search_songs(
            query=query,
            limit=PROVIDER_LIMIT,
        )

        for item in data.get(
            "results",
            [],
        ):

            song = _normalize_itunes(
                item
            )

            if _append_unique(
                songs,
                song,
                used_keys,
            ):

                if len(songs) >= limit:
                    break

    except Exception as exc:

        print(
            f"[EXPLORE] iTunes search failed: {exc}"
        )


    # ========================================================
    # DEEZER FALLBACK
    # ========================================================

    if len(songs) < limit:

        try:

            remaining = (
                limit - len(songs)
            )

            data = await deezer_service.search_tracks(
                query=query,
                limit=min(
                    PROVIDER_LIMIT,
                    remaining,
                ),
            )

            for item in data.get(
                "data",
                [],
            ):

                song = _normalize_deezer(
                    item
                )

                if _append_unique(
                    songs,
                    song,
                    used_keys,
                ):

                    if len(songs) >= limit:
                        break

        except Exception as exc:

            print(
                f"[EXPLORE] Deezer search failed: {exc}"
            )


    return songs[:limit]


# ============================================================
# SEARCH MULTIPLE QUERIES
# ============================================================

async def _search_queries(
    queries,
    *,
    limit=SECTION_LIMIT,
    used_keys=None,
):

    if used_keys is None:
        used_keys = set()

    songs = []

    for query in queries:

        if len(songs) >= limit:
            break

        remaining = (
            limit - len(songs)
        )

        results = await _search(
            query,
            limit=remaining,
            used_keys=used_keys,
        )

        songs.extend(results)

    return songs[:limit]


# ============================================================
# BUILD STABLE EXPLORE
# ============================================================

async def _build_stable_explore():

    print(
        "[EXPLORE] Building stable content..."
    )

    result = {
        "languages": {},
        "moods": {},
        "activities": {},
        "trending": [],
        "discover": [],
    }

    # ========================================================
    # GLOBAL DUPLICATE SET
    # ========================================================

    used_keys = set()


    # ========================================================
    # LANGUAGES
    # ========================================================

    for language, queries in (
        LANGUAGE_QUERIES.items()
    ):

        songs = await _search_queries(
            queries,
            limit=SECTION_LIMIT,
            used_keys=used_keys,
        )

        result["languages"][language] = songs

        print(
            f"[EXPLORE] {language}: "
            f"{len(songs)} songs"
        )


    # ========================================================
    # MOODS
    # ========================================================

    for mood, query in (
        MOOD_QUERIES.items()
    ):

        songs = await _search(
            query,
            limit=SECTION_LIMIT,
            used_keys=used_keys,
        )

        result["moods"][mood] = songs

        print(
            f"[EXPLORE] Mood {mood}: "
            f"{len(songs)} songs"
        )


    # ========================================================
    # ACTIVITIES
    # ========================================================

    for activity, query in (
        ACTIVITY_QUERIES.items()
    ):

        songs = await _search(
            query,
            limit=SECTION_LIMIT,
            used_keys=used_keys,
        )

        result["activities"][activity] = songs

        print(
            f"[EXPLORE] Activity {activity}: "
            f"{len(songs)} songs"
        )


    # ========================================================
    # TRENDING
    # ========================================================

    result["trending"] = await _search(
        "trending songs India",
        limit=SECTION_LIMIT,
        used_keys=used_keys,
    )

    print(
        "[EXPLORE] Trending:",
        len(result["trending"]),
        "songs",
    )


    # ========================================================
    # DISCOVER
    # ========================================================

    result["discover"] = await _search(
        "new songs new artists",
        limit=SECTION_LIMIT,
        used_keys=used_keys,
    )

    print(
        "[EXPLORE] Discover:",
        len(result["discover"]),
        "songs",
    )


    print(
        "[EXPLORE] Stable content complete."
    )

    return result


# ============================================================
# MEANINGFUL EVENTS
# ============================================================

MEANINGFUL_EVENTS = (
    "play",
    "complete",
    "skip",
    "favorite",
    "library",
    "playlist",
)


# ============================================================
# COUNT MEANINGFUL EVENTS
# ============================================================

def _meaningful_event_count(
    db,
    device_id,
):

    return (
        db.query(
            ListeningEvent
        )
        .filter(
            ListeningEvent.device_id
            == device_id,

            ListeningEvent.event_type.in_(
                MEANINGFUL_EVENTS
            ),
        )
        .count()
    )


# ============================================================
# BUILD MADE FOR YOU
# ============================================================

async def _build_made_for_you(
    db,
    device_id,
):

    print(
        "[EXPLORE] Building Made For You..."
    )

    return await build_recommendations(
        db=db,
        device_id=device_id,
        limit=SECTION_LIMIT,
    )


# ============================================================
# BUILD EXPLORE
# ============================================================

async def build_explore(
    db,
    *,
    device_id,
):

    # ========================================================
    # STABLE EXPLORE
    # ========================================================

    stable = get_stable(
        device_id=device_id,
    )

    if stable is None:

        stable = await _build_stable_explore()

        set_stable(
            device_id=device_id,
            data=stable,
        )


    # ========================================================
    # BEHAVIOR COUNT
    # ========================================================

    behavior_count = (
        _meaningful_event_count(
            db,
            device_id,
        )
    )


    # ========================================================
    # PERSONALIZED CACHE
    # ========================================================

    personalized = get_personalized(
        device_id=device_id,
    )


    # ========================================================
    # DETERMINE REFRESH
    # ========================================================

    should_refresh = False

    if personalized is None:

        should_refresh = True

    else:

        previous_count = personalized.get(
            "behavior_count",
            0,
        )

        new_events = max(
            0,
            behavior_count
            - previous_count,
        )

        if (
            new_events
            >= PERSONALIZATION_REFRESH_EVENTS
        ):

            should_refresh = True


    # ========================================================
    # MADE FOR YOU
    # ========================================================

    if should_refresh:

        made_for_you = (
            await _build_made_for_you(
                db,
                device_id,
            )
        )

        set_personalized(
            device_id=device_id,
            data=made_for_you,
            behavior_count=behavior_count,
        )

    else:

        made_for_you = personalized[
            "data"
        ]


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {
        "mode": (
            "personalized"
            if made_for_you.get(
                "mode"
            ) == "personalized"
            else "discovery"
        ),

        "made_for_you": made_for_you,

        "languages": stable.get(
            "languages",
            {},
        ),

        "moods": stable.get(
            "moods",
            {},
        ),

        "activities": stable.get(
            "activities",
            {},
        ),

        "trending": stable.get(
            "trending",
            [],
        ),

        "discover": stable.get(
            "discover",
            [],
        ),
    }