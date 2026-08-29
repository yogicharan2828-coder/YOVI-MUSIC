import time
from uuid import uuid4

from fastapi import (
    APIRouter,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel

from app.services.jam import jam_manager


router = APIRouter(
    prefix="/jam",
    tags=["Jam Sessions"],
)


# ==========================================================
# REQUEST SCHEMAS
# ==========================================================

class CreateJamRequest(BaseModel):
    host_id: str


class JoinJamRequest(BaseModel):
    user_id: str


# ==========================================================
# WEBSOCKET CONNECTION MANAGER
# ==========================================================

class ConnectionManager:

    def __init__(self):
        self.connections = {}


    async def connect(
        self,
        session_id: str,
        user_id: str,
        websocket: WebSocket,
    ):

        await websocket.accept()

        if session_id not in self.connections:
            self.connections[session_id] = {}

        self.connections[
            session_id
        ][user_id] = websocket


    def disconnect(
        self,
        session_id: str,
        user_id: str,
    ):

        if session_id not in self.connections:
            return

        self.connections[
            session_id
        ].pop(user_id, None)

        if not self.connections[
            session_id
        ]:
            del self.connections[
                session_id
            ]


    async def broadcast(
        self,
        session_id: str,
        message: dict,
        exclude_user_id: str | None = None,
    ):

        connections = self.connections.get(
            session_id,
            {},
        )

        dead_connections = []

        for user_id, websocket in (
            connections.items()
        ):

            if exclude_user_id is not None and user_id == exclude_user_id:
                continue

            try:
                await websocket.send_json(
                    message
                )

            except Exception:
                dead_connections.append(
                    user_id
                )

        for user_id in dead_connections:
            self.disconnect(
                session_id,
                user_id,
            )


connection_manager = ConnectionManager()


# ==========================================================
# CREATE
# ==========================================================

@router.post("/create")
async def create_jam(
    request: CreateJamRequest,
):

    session_id = (
        "YOVI-"
        + uuid4().hex[:6].upper()
    )

    session = jam_manager.create_session(
        session_id=session_id,
        host_id=request.host_id,
    )

    return {
        "success": True,
        "message": "Jam session created",
        "session": jam_manager.serialize(
            session
        ),
    }


# ==========================================================
# JOIN
# ==========================================================

@router.post("/{session_id}/join")
async def join_jam(
    session_id: str,
    request: JoinJamRequest,
):

    session = jam_manager.get_session(
        session_id
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Jam session not found",
        )

    jam_manager.add_participant(
        session_id=session_id,
        user_id=request.user_id,
    )

    session = jam_manager.get_session(
        session_id
    )

    await connection_manager.broadcast(
        session_id,
        {
            "type": "PARTICIPANT_JOINED",
            "user_id": request.user_id,
            "participant_count": len(
                session.participants
            ),
        },
    )

    return {
        "success": True,
        "message": "Joined jam session",
        "session": jam_manager.serialize(
            session
        ),
    }


# ==========================================================
# GET SESSION
# ==========================================================

@router.get("/{session_id}")
async def get_jam(
    session_id: str,
):

    session = jam_manager.get_session(
        session_id
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Jam session not found",
        )

    return {
        "success": True,
        "session": jam_manager.serialize(
            session
        ),
    }


# ==========================================================
# LEAVE
# ==========================================================

@router.post("/{session_id}/leave")
async def leave_jam(
    session_id: str,
    request: JoinJamRequest,
):

    session = jam_manager.get_session(
        session_id
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Jam session not found",
        )

    jam_manager.remove_participant(
        session_id=session_id,
        user_id=request.user_id,
    )

    session = jam_manager.get_session(
        session_id
    )

    if session:

        await connection_manager.broadcast(
            session_id,
            {
                "type": "PARTICIPANT_LEFT",
                "user_id": request.user_id,
            },
        )

    return {
        "success": True,
        "message": "Left jam session",
    }


# ==========================================================
# WEBSOCKET
# ==========================================================

@router.websocket(
    "/ws/{session_id}/{user_id}"
)
async def jam_websocket(
    websocket: WebSocket,
    session_id: str,
    user_id: str,
):

    session = jam_manager.get_session(
        session_id
    )

    if not session:

        await websocket.close(
            code=4004
        )

        return


    # ------------------------------------------------------
    # ONLY HOST CAN CONTROL PLAYBACK
    # ------------------------------------------------------

    is_host = (
        user_id == session.host_id
    )


    jam_manager.add_participant(
        session_id=session_id,
        user_id=user_id,
    )


    await connection_manager.connect(
        session_id=session_id,
        user_id=user_id,
        websocket=websocket,
    )


    # ------------------------------------------------------
    # SEND CURRENT STATE
    # ------------------------------------------------------

    await websocket.send_json(
        {
            "type": "SESSION_STATE",
            "session":
                jam_manager.serialize(
                    session
                ),
        }
    )


    await connection_manager.broadcast(
        session_id,
        {
            "type": "PARTICIPANT_JOINED",
            "user_id": user_id,
            "participant_count":
                len(session.participants),
        },
    )


    try:

        while True:

            event = (
                await websocket.receive_json()
            )


            event_type = event.get(
                "type"
            )


            # ==================================================
            # PLAY
            # ==================================================

            if event_type == "PLAY":

                if not is_host:
                    continue


                position = float(
                    event.get(
                        "position",
                        session.position,
                    )
                )


                jam_manager.update_playback(
                    session_id=session_id,
                    is_playing=True,
                    position=position,
                )


                await connection_manager.broadcast(
                    session_id,
                    {
                        "type": "PLAY",
                        "position": position,
                        "server_time":
                            time.time(),
                    },
                    exclude_user_id=user_id,
                )


            # ==================================================
            # PAUSE
            # ==================================================

            elif event_type == "PAUSE":

                if not is_host:
                    continue


                position = float(
                    event.get(
                        "position",
                        session.position,
                    )
                )


                jam_manager.update_playback(
                    session_id=session_id,
                    is_playing=False,
                    position=position,
                )


                await connection_manager.broadcast(
                    session_id,
                    {
                        "type": "PAUSE",
                        "position": position,
                        "server_time":
                            time.time(),
                    },
                    exclude_user_id=user_id,
                )


            # ==================================================
            # SEEK
            # ==================================================

            elif event_type == "SEEK":

                if not is_host:
                    continue


                position = float(
                    event.get(
                        "position",
                        0,
                    )
                )


                jam_manager.update_playback(
                    session_id=session_id,
                    position=position,
                )


                await connection_manager.broadcast(
                    session_id,
                    {
                        "type": "SEEK",
                        "position": position,
                        "server_time":
                            time.time(),
                    },
                    exclude_user_id=user_id,
                )


            # ==================================================
            # SONG CHANGE
            # ==================================================

            elif event_type == "SONG_CHANGE":

                if not is_host:
                    continue


                song = event.get(
                    "song"
                )


                if not song:
                    continue


                position = float(
                    event.get(
                        "position",
                        0,
                    )
                )


                jam_manager.update_playback(
                    session_id=session_id,
                    current_song=song,
                    is_playing=False,
                    position=position,
                )


                await connection_manager.broadcast(
                    session_id,
                    {
                        "type": "SONG_CHANGE",
                        "song": song,
                        "position": position,
                        "server_time":
                            time.time(),
                    },
                    exclude_user_id=user_id,
                )


            # ==================================================
            # UNKNOWN EVENT
            # ==================================================

            else:

                await websocket.send_json(
                    {
                        "type": "ERROR",
                        "message":
                            "Unknown jam event",
                    }
                )


    except WebSocketDisconnect:

        connection_manager.disconnect(
            session_id,
            user_id,
        )

        jam_manager.remove_participant(
            session_id=session_id,
            user_id=user_id,
        )


        if jam_manager.get_session(
            session_id
        ):

            await connection_manager.broadcast(
                session_id,
                {
                    "type":
                        "PARTICIPANT_LEFT",
                    "user_id": user_id,
                },
            )