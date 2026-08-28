from fastapi import APIRouter

from app.schemas.player import (
    PlaybackCommand,
    PlaybackState,
    SeekCommand,
)
from app.services.player import player_service


router = APIRouter(
    prefix="/player",
    tags=["Player"],
)


@router.get(
    "/state",
    response_model=PlaybackState,
)
async def get_player_state():

    return player_service.get_state()


@router.post(
    "/load",
    response_model=PlaybackState,
)
async def load_song(
    command: PlaybackCommand,
):

    if not command.song_id:
        raise ValueError(
            "song_id is required"
        )

    if not command.youtube_video_id:
        raise ValueError(
            "youtube_video_id is required"
        )

    return player_service.load_song(
        song_id=command.song_id,
        youtube_video_id=command.youtube_video_id,
    )


@router.post(
    "/play",
    response_model=PlaybackState,
)
async def play_song(
    command: PlaybackCommand,
):

    return player_service.play(
        position_seconds=command.position_seconds,
    )


@router.post(
    "/pause",
    response_model=PlaybackState,
)
async def pause_song(
    command: PlaybackCommand,
):

    return player_service.pause(
        position_seconds=command.position_seconds,
    )


@router.post(
    "/seek",
    response_model=PlaybackState,
)
async def seek_song(
    command: SeekCommand,
):

    return player_service.seek(
        position_seconds=command.position_seconds,
    )