from app.schemas.player import PlaybackState


class PlayerService:

    def __init__(self):
        self.state = PlaybackState()

    def get_state(self) -> PlaybackState:
        return self.state

    def load_song(
        self,
        song_id: str,
        youtube_video_id: str,
    ) -> PlaybackState:

        self.state.song_id = song_id
        self.state.youtube_video_id = youtube_video_id
        self.state.position_seconds = 0.0
        self.state.is_playing = False

        return self.state

    def play(
        self,
        position_seconds: float = 0.0,
    ) -> PlaybackState:

        self.state.position_seconds = position_seconds
        self.state.is_playing = True

        return self.state

    def pause(
        self,
        position_seconds: float,
    ) -> PlaybackState:

        self.state.position_seconds = position_seconds
        self.state.is_playing = False

        return self.state

    def seek(
        self,
        position_seconds: float,
    ) -> PlaybackState:

        self.state.position_seconds = position_seconds

        return self.state


player_service = PlayerService()