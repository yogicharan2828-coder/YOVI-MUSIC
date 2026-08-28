from dataclasses import dataclass, field
from typing import Dict, Set


@dataclass
class JamSession:

    session_id: str

    host_id: str

    current_song: dict | None = None

    is_playing: bool = False

    position: float = 0.0

    participants: Set[str] = field(
        default_factory=set
    )


class JamManager:

    def __init__(self):

        self.sessions: Dict[
            str,
            JamSession
        ] = {}


    # ==========================================================
    # CREATE SESSION
    # ==========================================================

    def create_session(
        self,
        session_id: str,
        host_id: str,
    ) -> JamSession:

        session = JamSession(
            session_id=session_id,
            host_id=host_id,
        )

        session.participants.add(
            host_id
        )

        self.sessions[
            session_id
        ] = session

        return session


    # ==========================================================
    # GET SESSION
    # ==========================================================

    def get_session(
        self,
        session_id: str,
    ) -> JamSession | None:

        return self.sessions.get(
            session_id
        )


    # ==========================================================
    # JOIN SESSION
    # ==========================================================

    def add_participant(
        self,
        session_id: str,
        user_id: str,
    ) -> JamSession | None:

        session = self.get_session(
            session_id
        )

        if not session:
            return None

        session.participants.add(
            user_id
        )

        return session


    # ==========================================================
    # LEAVE SESSION
    # ==========================================================

    def remove_participant(
        self,
        session_id: str,
        user_id: str,
    ):

        session = self.get_session(
            session_id
        )

        if not session:
            return

        session.participants.discard(
            user_id
        )

        # Remove empty sessions
        if not session.participants:

            del self.sessions[
                session_id
            ]


    # ==========================================================
    # UPDATE PLAYBACK
    # ==========================================================

    def update_playback(
        self,
        session_id: str,
        current_song: dict | None = None,
        is_playing: bool | None = None,
        position: float | None = None,
    ):

        session = self.get_session(
            session_id
        )

        if not session:
            return None


        if current_song is not None:

            session.current_song = (
                current_song
            )


        if is_playing is not None:

            session.is_playing = (
                is_playing
            )


        if position is not None:

            session.position = (
                float(position)
            )


        return session


    # ==========================================================
    # SERIALIZE SESSION
    # ==========================================================

    def serialize(
        self,
        session: JamSession,
    ):

        return {
            "session_id":
                session.session_id,

            "host_id":
                session.host_id,

            "current_song":
                session.current_song,

            "is_playing":
                session.is_playing,

            "position":
                session.position,

            "participants":
                list(
                    session.participants
                ),

            "participant_count":
                len(
                    session.participants
                ),
        }


jam_manager = JamManager()