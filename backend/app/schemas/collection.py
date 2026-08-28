from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


CollectionType = Literal[
    "library",
    "favorites",
]


class CollectionSongCreate(BaseModel):

    external_id: str | None = Field(
        default=None,
        max_length=255,
    )

    external_source: str | None = Field(
        default=None,
        max_length=50,
    )

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

    image: str | None = None

    cover_url: str | None = None

    video_id: str | None = Field(
        default=None,
        max_length=255,
    )

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


class CollectionSongResponse(
    CollectionSongCreate
):

    id: int

    collection_type: str

    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class PlaylistCreate(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=100,
    )


class PlaylistResponse(BaseModel):

    id: int

    name: str

    created_at: datetime

    songs: list[
        CollectionSongResponse
    ] = []

    model_config = {
        "from_attributes": True,
    }