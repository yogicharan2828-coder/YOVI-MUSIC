from collections import defaultdict
import re

from sqlalchemy.orm import Session

from app.models.listening_event import ListeningEvent

from app.services.music.itunes import (
    itunes_service,
)

from app.services.music.deezer import (
    deezer_service,
)

from app.services.personalization import (
    EVENT_WEIGHTS,
    build_listening_profile,
)

from app.services.recommendation_cache import (
    get as get_recommendation_cache,
    set as set_recommendation_cache,
)


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_LIMIT = 20
MAX_LIMIT = 50

MAX_HISTORY_EVENTS = 5000

MAX_PREFERRED_ARTISTS = 5

PERSONALIZED_SEARCH_LIMIT = 10
DISCOVERY_SEARCH_LIMIT = 15

# How much of the final list should come from
# familiar taste versus broader discovery.
FAMILIAR_RATIO = 0.55


# ============================================================
# TEXT HELPERS
# ============================================================

def _clean_text(value):

    if value is None:
        return ""

    return str(value).strip()


def _normalize_text(value):

    value = _clean_text(value).lower()

    value = re.sub(
        r"[^\w\s&,'-]",
        " ",
        value,
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value.strip()


def _artist_tokens(artist):

    artist = _clean_text(artist)

    if not artist:
        return []

    parts = re.split(
        r"\s*(?:,|&|\band\b|\bx\b)\s*",
        artist,
        flags=re.IGNORECASE,
    )

    tokens = []

    for part in parts:

        normalized = _normalize_text(
            part
        )

        if normalized:
            tokens.append(
                normalized
            )

    return tokens


# ============================================================
# NORMALIZE iTUNES
# ============================================================

def _normalize_itunes_result(item: dict):

    return {
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


# ============================================================
# NORMALIZE DEEZER
# ============================================================

def _normalize_deezer_result(item: dict):

    artist_data = (
        item.get("artist")
        or {}
    )

    album_data = (
        item.get("album")
        or {}
    )

    return {
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

        "duration": item.get(
            "duration"
        ),

        "preview_url": item.get(
            "preview"
        ),

        "external_url": item.get(
            "link"
        ),
    }


# ============================================================
# VALID SONG
# ============================================================

def _valid_song(song):

    return bool(
        song.get("id")
        and song.get("title")
        and song.get("artist")
    )


# ============================================================
# SONG KEY
# ============================================================

def _song_key(song):

    title = _normalize_text(
        song.get("title")
    )

    artist = _normalize_text(
        song.get("artist")
    )

    return (
        f"{title}::{artist}"
    )


# ============================================================
# PROVIDER SEARCH
# ============================================================

async def _search_providers(
    query: str,
    limit: int = 10,
):

    results = []

    # --------------------------------------------------------
    # iTUNES
    # --------------------------------------------------------

    try:

        data = await (
            itunes_service.search_songs(
                query=query,
                limit=limit,
            )
        )

        for item in data.get(
            "results",
            [],
        ):

            song = (
                _normalize_itunes_result(
                    item
                )
            )

            if _valid_song(song):

                results.append(
                    song
                )

    except Exception as exc:

        print(
            "Recommendation iTunes "
            f"search failed: {exc}"
        )


    # --------------------------------------------------------
    # DEEZER
    # --------------------------------------------------------

    try:

        data = await (
            deezer_service.search_tracks(
                query=query,
                limit=limit,
            )
        )

        for item in data.get(
            "data",
            [],
        ):

            song = (
                _normalize_deezer_result(
                    item
                )
            )

            if _valid_song(song):

                results.append(
                    song
                )

    except Exception as exc:

        print(
            "Recommendation Deezer "
            f"search failed: {exc}"
        )


    return results


# ============================================================
# LISTENING EVENTS
# ============================================================

def _get_listening_events(
    db: Session,
    *,
    user_id=None,
    device_id=None,
):

    query = db.query(
        ListeningEvent
    )

    if user_id is not None:

        query = query.filter(
            ListeningEvent.user_id
            == user_id
        )

    elif device_id:

        query = query.filter(
            ListeningEvent.device_id
            == device_id
        )

    else:

        return []

    return (
        query
        .order_by(
            ListeningEvent.created_at.desc()
        )
        .limit(
            MAX_HISTORY_EVENTS
        )
        .all()
    )


# ============================================================
# RECOMMENDATION CACHE SIGNATURE
# ============================================================

def _get_history_signature(
    db: Session,
    *,
    user_id=None,
    device_id=None,
):
    """
    Create a lightweight signature representing the current
    listening history.

    When a new listening event is created, the count and/or
    latest event timestamp changes. That automatically causes
    the recommendation cache to become stale.
    """

    query = db.query(
        ListeningEvent
    )

    if user_id is not None:

        query = query.filter(
            ListeningEvent.user_id
            == user_id
        )

    elif device_id:

        query = query.filter(
            ListeningEvent.device_id
            == device_id
        )

    else:

        return (
            0,
            None,
        )


    count = query.count()


    latest_event = (
        query
        .order_by(
            ListeningEvent.created_at.desc()
        )
        .first()
    )


    latest_created_at = (
        latest_event.created_at
        if latest_event
        else None
    )


    return (
        count,
        latest_created_at,
    )


# ============================================================
# ARTIST PREFERENCE
# ============================================================

def _build_artist_scores(events):

    scores = defaultdict(float)

    for event in events:

        if not event.artist:
            continue

        weight = EVENT_WEIGHTS.get(
            event.event_type,
            0.0,
        )

        if weight == 0:
            continue

        for artist in _artist_tokens(
            event.artist
        ):

            scores[artist] += weight

    return dict(scores)


# ============================================================
# RECENT ARTIST PREFERENCE
# ============================================================

def _build_recent_artist_scores(events):

    scores = defaultdict(float)

    for index, event in enumerate(
        events
    ):

        if not event.artist:
            continue

        weight = EVENT_WEIGHTS.get(
            event.event_type,
            0.0,
        )

        if weight == 0:
            continue

        recency_multiplier = max(
            0.25,
            1.0 - (
                index / 100.0
            ),
        )

        for artist in _artist_tokens(
            event.artist
        ):

            scores[artist] += (
                weight
                * recency_multiplier
            )

    return dict(scores)


# ============================================================
# LISTENED SONGS
# ============================================================

def _build_listened_song_keys(events):

    listened = set()

    for event in events:

        title = _normalize_text(
            event.title
        )

        artist = _normalize_text(
            event.artist
        )

        if title and artist:

            listened.add(
                f"{title}::{artist}"
            )

    return listened


# ============================================================
# LISTENED ARTISTS
# ============================================================

def _build_listened_artist_keys(events):

    artists = set()

    for event in events:

        if not event.artist:
            continue

        for artist in _artist_tokens(
            event.artist
        ):

            artists.add(
                artist
            )

    return artists


# ============================================================
# SCORE SONG
# ============================================================

def _score_song(
    song,
    artist_scores,
    recent_artist_scores,
    listened_songs,
):

    title = _normalize_text(
        song.get("title")
    )

    artist = _normalize_text(
        song.get("artist")
    )

    if not title or not artist:

        return -10000.0


    song_key = (
        f"{title}::{artist}"
    )


    # --------------------------------------------------------
    # HARD EXCLUSION
    # --------------------------------------------------------

    if song_key in listened_songs:

        return -10000.0


    candidate_artists = (
        _artist_tokens(
            song.get("artist")
        )
    )


    score = 0.0


    # --------------------------------------------------------
    # PREFERRED ARTIST
    # --------------------------------------------------------

    for candidate_artist in (
        candidate_artists
    ):

        preference = (
            artist_scores.get(
                candidate_artist,
                0.0,
            )
        )

        if preference > 0:

            score += (
                preference * 10.0
            )


    # --------------------------------------------------------
    # RECENT ARTIST
    # --------------------------------------------------------

    for candidate_artist in (
        candidate_artists
    ):

        recent = (
            recent_artist_scores.get(
                candidate_artist,
                0.0,
            )
        )

        if recent > 0:

            score += (
                recent * 2.5
            )


    return score


# ============================================================
# DEDUPLICATE
# ============================================================

def _deduplicate_songs(songs):

    unique = {}

    for song in songs:

        key = _song_key(
            song
        )

        if key not in unique:

            unique[key] = song

    return list(
        unique.values()
    )


# ============================================================
# DISCOVERY QUERIES
# ============================================================

def _build_discovery_queries(
    events,
    top_artists,
):

    queries = []


    # --------------------------------------------------------
    # Preferred artist combinations
    # --------------------------------------------------------

    if len(
        top_artists
    ) >= 2:

        first_artist = (
            top_artists[0][0]
        )

        second_artist = (
            top_artists[1][0]
        )

        queries.append(
            f"{first_artist} {second_artist}"
        )


    # --------------------------------------------------------
    # Recent listening context
    # --------------------------------------------------------

    added_context = 0

    for event in events:

        if not event.title:
            continue

        if not event.artist:
            continue

        queries.append(
            f"{event.title} {event.artist}"
        )

        added_context += 1

        if added_context >= 2:
            break


    # --------------------------------------------------------
    # BROAD DISCOVERY
    # --------------------------------------------------------

    queries.extend(
        [
            "new music",
            "trending music",
            "popular songs",
            "new popular songs",
        ]
    )


    # --------------------------------------------------------
    # Deduplicate queries
    # --------------------------------------------------------

    unique_queries = []

    seen = set()

    for query in queries:

        normalized = _normalize_text(
            query
        )

        if (
            normalized
            and normalized not in seen
        ):

            seen.add(
                normalized
            )

            unique_queries.append(
                query
            )

    return unique_queries


# ============================================================
# BUILD RECOMMENDATIONS
# ============================================================

async def build_recommendations(
    db: Session,
    *,
    user_id=None,
    device_id=None,
    limit=DEFAULT_LIMIT,
):

    limit = max(
        1,
        min(
            int(limit),
            MAX_LIMIT,
        ),
    )


    # ========================================================
    # RECOMMENDATION CACHE
    # ========================================================

    history_signature = (
        _get_history_signature(
            db=db,
            user_id=user_id,
            device_id=device_id,
        )
    )


    cached = get_recommendation_cache(
        user_id=user_id,
        device_id=device_id,
        history_signature=history_signature,
    )


    if cached:

        cached_results = (
            cached.get("results")
            or []
        )


        return {
            **cached,

            "count": min(
                len(cached_results),
                limit,
            ),

            "results":
                cached_results[:limit],
        }


    # ========================================================
    # PROFILE
    # ========================================================

    profile = (
        build_listening_profile(
            db=db,
            user_id=user_id,
            device_id=device_id,
        )
    )


    # ========================================================
    # HISTORY
    # ========================================================

    events = _get_listening_events(
        db,
        user_id=user_id,
        device_id=device_id,
    )


    if not events:

        result = {
            "mode": "discovery",
            "profile": profile,
            "count": 0,
            "results": [],
        }


        set_recommendation_cache(
            user_id=user_id,
            device_id=device_id,
            history_signature=history_signature,
            data=result,
        )


        return result


    # ========================================================
    # BEHAVIOR
    # ========================================================

    artist_scores = (
        _build_artist_scores(
            events
        )
    )

    recent_artist_scores = (
        _build_recent_artist_scores(
            events
        )
    )

    listened_songs = (
        _build_listened_song_keys(
            events
        )
    )


    # ========================================================
    # MODE
    # ========================================================

    total_events = profile[
        "total_events"
    ]

    if total_events < 5:

        mode = "discovery"

    elif total_events < 15:

        mode = "learning"

    else:

        mode = "personalized"


    # ========================================================
    # TOP ARTISTS
    # ========================================================

    top_artists = sorted(
        artist_scores.items(),
        key=lambda item:
            item[1],
        reverse=True,
    )[
        :MAX_PREFERRED_ARTISTS
    ]


    # ========================================================
    # FAMILIAR CANDIDATES
    # ========================================================

    familiar_candidates = []


    for artist, _score in (
        top_artists
    ):

        results = await (
            _search_providers(
                query=artist,
                limit=PERSONALIZED_SEARCH_LIMIT,
            )
        )

        familiar_candidates.extend(
            results
        )


    familiar_candidates = (
        _deduplicate_songs(
            familiar_candidates
        )
    )


    # ========================================================
    # DISCOVERY CANDIDATES
    # ========================================================

    discovery_candidates = []


    discovery_queries = (
        _build_discovery_queries(
            events,
            top_artists,
        )
    )


    for query in discovery_queries:

        results = await (
            _search_providers(
                query=query,
                limit=DISCOVERY_SEARCH_LIMIT,
            )
        )

        discovery_candidates.extend(
            results
        )

        if len(
            discovery_candidates
        ) >= limit * 4:

            break


    discovery_candidates = (
        _deduplicate_songs(
            discovery_candidates
        )
    )


    # ========================================================
    # SCORE FAMILIAR
    # ========================================================

    familiar_scored = []


    for song in (
        familiar_candidates
    ):

        score = _score_song(
            song,
            artist_scores,
            recent_artist_scores,
            listened_songs,
        )

        if score <= -1000:
            continue

        familiar_scored.append(
            (
                score,
                song,
            )
        )


    familiar_scored.sort(
        key=lambda item:
            item[0],
        reverse=True,
    )


    # ========================================================
    # SCORE DISCOVERY
    # ========================================================

    discovery_scored = []


    for song in (
        discovery_candidates
    ):

        score = _score_song(
            song,
            artist_scores,
            recent_artist_scores,
            listened_songs,
        )

        if score <= -1000:
            continue


        # Discovery receives a baseline score so that
        # completely new artists can still compete.

        discovery_score = (
            100.0
            + (
                score * 0.15
            )
        )


        discovery_scored.append(
            (
                discovery_score,
                song,
            )
        )


    discovery_scored.sort(
        key=lambda item:
            item[0],
        reverse=True,
    )


    # ========================================================
    # FINAL MIX
    # ========================================================

    familiar_count = round(
        limit
        * FAMILIAR_RATIO
    )

    discovery_count = (
        limit
        - familiar_count
    )


    recommendations = []

    used_keys = set()


    # ========================================================
    # FAMILIAR
    # ========================================================

    for score, song in (
        familiar_scored
    ):

        key = _song_key(
            song
        )

        if key in used_keys:
            continue

        used_keys.add(
            key
        )

        recommendations.append(
            {
                **song,

                "recommendation_score":
                    round(
                        score,
                        2,
                    ),

                "recommendation_type":
                    "familiar",
            }
        )

        if len(
            recommendations
        ) >= familiar_count:

            break


    # ========================================================
    # DISCOVERY
    # ========================================================

    discovery_added = 0


    for score, song in (
        discovery_scored
    ):

        key = _song_key(
            song
        )

        if key in used_keys:
            continue

        used_keys.add(
            key
        )

        recommendations.append(
            {
                **song,

                "recommendation_score":
                    round(
                        score,
                        2,
                    ),

                "recommendation_type":
                    "discovery",
            }
        )

        discovery_added += 1

        if discovery_added >= (
            discovery_count
        ):

            break


    # ========================================================
    # FILL REMAINING SLOTS
    # ========================================================

    if len(
        recommendations
    ) < limit:

        remaining = (
            familiar_scored
            + discovery_scored
        )


        for score, song in (
            remaining
        ):

            key = _song_key(
                song
            )

            if key in used_keys:
                continue

            used_keys.add(
                key
            )

            recommendations.append(
                {
                    **song,

                    "recommendation_score":
                        round(
                            score,
                            2,
                        ),

                    "recommendation_type":
                        "discovery",
                }
            )

            if len(
                recommendations
            ) >= limit:

                break


    # ========================================================
    # FINAL RESULT
    # ========================================================

    result = {
        "mode": mode,

        "profile": profile,

        "count":
            len(
                recommendations
            ),

        "results":
            recommendations,
    }


    # ========================================================
    # SAVE FINAL RECOMMENDATIONS
    # ========================================================

    set_recommendation_cache(
        user_id=user_id,
        device_id=device_id,
        history_signature=history_signature,
        data=result,
    )


    # ========================================================
    # RETURN REQUESTED LIMIT
    # ========================================================

    return {
        **result,

        "count": min(
            len(
                recommendations
            ),
            limit,
        ),

        "results":
            recommendations[:limit],
    }