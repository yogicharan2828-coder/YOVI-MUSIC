from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.listening_event import ListeningEvent


# ============================================================
# EVENT WEIGHTS
# ============================================================

EVENT_WEIGHTS = {
    "play": 1.0,
    "progress": 0.0,
    "pause": 0.25,
    "complete": 3.0,
    "skip": -2.0,
    "favorite": 5.0,
    "library": 4.0,
    "playlist": 4.0,
}


# ============================================================
# RANK PREFERENCES
# ============================================================

def _rank(
    values: dict[str, float],
    limit: int = 10,
):
    """
    Return positive preference scores sorted from
    strongest to weakest.
    """

    ranked = [
        {
            "value": key,
            "score": round(score, 2),
        }
        for key, score in values.items()
        if score > 0
    ]

    ranked.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return ranked[:limit]


# ============================================================
# BUILD LISTENING PROFILE
# ============================================================

def build_listening_profile(
    db: Session,
    user_id: int | None = None,
    device_id: str | None = None,
    limit_events: int = 5000,
):
    """
    Build a behavioral preference profile.

    YOVI supports two identity modes:

    1. Authenticated users
       user_id is used.

    2. Anonymous users
       device_id is used.

    If user_id is supplied, it takes precedence.
    """

    # --------------------------------------------------------
    # No identity
    # --------------------------------------------------------

    if user_id is None and not device_id:
        return {
            "total_events": 0,
            "total_plays": 0,
            "total_completions": 0,
            "languages": [],
            "genres": [],
            "moods": [],
            "artists": [],
        }


    # --------------------------------------------------------
    # Build event query
    # --------------------------------------------------------

    query = db.query(
        ListeningEvent
    )


    if user_id is not None:

        query = query.filter(
            ListeningEvent.user_id == user_id
        )

    else:

        query = query.filter(
            ListeningEvent.device_id == device_id
        )


    events = (
        query
        .order_by(
            ListeningEvent.created_at.desc()
        )
        .limit(limit_events)
        .all()
    )


    # --------------------------------------------------------
    # Preference buckets
    # --------------------------------------------------------

    languages = defaultdict(float)

    genres = defaultdict(float)

    moods = defaultdict(float)

    artists = defaultdict(float)


    # --------------------------------------------------------
    # Calculate preference scores
    # --------------------------------------------------------

    for event in events:

        weight = EVENT_WEIGHTS.get(
            event.event_type,
            0.0,
        )


        if weight == 0:
            continue


        # ----------------------------------------------------
        # LANGUAGE
        # ----------------------------------------------------

        if event.language:

            language = event.language.strip()

            if language:

                languages[language] += weight


        # ----------------------------------------------------
        # GENRE
        # ----------------------------------------------------

        if event.genre:

            genre = event.genre.strip()

            if genre:

                genres[genre] += weight


        # ----------------------------------------------------
        # MOOD
        # ----------------------------------------------------

        if event.mood:

            mood = event.mood.strip()

            if mood:

                moods[mood] += weight


        # ----------------------------------------------------
        # ARTIST
        # ----------------------------------------------------

        if event.artist:

            artist = event.artist.strip()

            if artist:

                artists[artist] += weight


    # --------------------------------------------------------
    # BASIC COUNTERS
    # --------------------------------------------------------

    total_plays = sum(
        1
        for event in events
        if event.event_type == "play"
    )


    total_completions = sum(
        1
        for event in events
        if event.event_type == "complete"
    )


    # --------------------------------------------------------
    # RETURN PROFILE
    # --------------------------------------------------------

    return {
        "total_events": len(events),

        "total_plays": total_plays,

        "total_completions": total_completions,

        "languages": _rank(
            languages
        ),

        "genres": _rank(
            genres
        ),

        "moods": _rank(
            moods
        ),

        "artists": _rank(
            artists
        ),
    }