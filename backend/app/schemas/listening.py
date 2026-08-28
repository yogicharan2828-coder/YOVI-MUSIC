from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ListeningEventType = Literal[
    "play",
    "progress",
    "pause",
    "complete",
    "skip",
    "favorite",
    "library",
    "playlist",
]


# ============================================================
# CREATE LISTENING EVENT
# ============================================================

class ListeningEventCreate(BaseModel):
    """Payload sent by the frontend for one meaningful music event."""

    event_type: ListeningEventType

    # --------------------------------------------------------
    # Anonymous/device identity
    # --------------------------------------------------------

    device_id: str | None = Field(
        default=None,
        max_length=255,
    )

    # --------------------------------------------------------
    # Provider/local identity
    # --------------------------------------------------------

    song_id: int | None = None

    external_id: str | None = Field(
        default=None,
        max_length=255,
    )

    external_source: str | None = Field(
        default=None,
        max_length=50,
    )

    # --------------------------------------------------------
    # Song snapshot
    # --------------------------------------------------------

    title: str = Field(
        min_length=1,
        max_length=255,
    )

    artist: str | None = Field(
        default=None,
        max_length=255,
    )

    album: str | None = Field(
        default=None,
        max_length=255,
    )

    # --------------------------------------------------------
    # Recommendation metadata
    # --------------------------------------------------------

    language: str | None = Field(
        default=None,
        max_length=80,
    )

    genre: str | None = Field(
        default=None,
        max_length=120,
    )

    mood: str | None = Field(
        default=None,
        max_length=120,
    )

    # --------------------------------------------------------
    # Artwork
    # --------------------------------------------------------

    image: str | None = Field(
        default=None,
        max_length=500,
    )

    cover_url: str | None = Field(
        default=None,
        max_length=500,
    )

    # --------------------------------------------------------
    # Playback position
    # --------------------------------------------------------

    position_seconds: int | None = Field(
        default=None,
        ge=0,
    )

    duration_seconds: int | None = Field(
        default=None,
        ge=0,
    )


# ============================================================
# LISTENING EVENT RESPONSE
# ============================================================

class ListeningEventResponse(BaseModel):

    id: int

    event_type: str

    device_id: str | None

    title: str

    artist: str | None

    album: str | None

    external_id: str | None

    external_source: str | None

    # --------------------------------------------------------
    # Artwork
    # --------------------------------------------------------

    image: str | None

    cover_url: str | None

    # --------------------------------------------------------
    # Playback position
    # --------------------------------------------------------

    position_seconds: int | None

    duration_seconds: int | None

    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


# ============================================================
# LISTENING HISTORY
# ============================================================

class ListeningHistoryResponse(BaseModel):

    count: int

    results: list[
        ListeningEventResponse
    ]


# ============================================================
# PREFERENCE
# ============================================================

class PreferenceItem(BaseModel):

    value: str

    score: float


# ============================================================
# LISTENING PROFILE
# ============================================================

class ListeningProfileResponse(BaseModel):

    total_events: int

    total_plays: int

    total_completions: int

    languages: list[
        PreferenceItem
    ]

    genres: list[
        PreferenceItem
    ]

    moods: list[
        PreferenceItem
    ]

    artists: list[
        PreferenceItem
    ]