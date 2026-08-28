from pydantic import BaseModel, Field


class PlaybackState(BaseModel):
    song_id: str | None = None
    youtube_video_id: str | None = None
    is_playing: bool = False
    position_seconds: float = 0.0
    volume: int = Field(default=100, ge=0, le=100)


class PlaybackCommand(BaseModel):
    song_id: str | None = None
    youtube_video_id: str | None = None
    position_seconds: float = Field(
        default=0.0,
        ge=0,
    )
    is_playing: bool = False


class SeekCommand(BaseModel):
    position_seconds: float = Field(
        ...,
        ge=0,
    )