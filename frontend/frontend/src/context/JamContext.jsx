import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import API_BASE_URL from "../config/api";


const JamContext = createContext(null);


const INITIAL_JAM_STATE = {
  currentSong: null,
  isPlaying: false,
  position: 0,

  allowGuestPlayback: false,
  allowGuestSongChange: false,
  allowGuestQueue: false,
};


// ==========================================================
// WEBSOCKET URL
// ==========================================================

function getJamWebSocketUrl(
  sessionId,
  userId
) {

  const apiUrl =
    new URL(
      API_BASE_URL
    );


  const protocol =
    apiUrl.protocol === "https:"
      ? "wss:"
      : "ws:";


  return (
    `${protocol}//${apiUrl.host}` +
    `/jam/ws/${encodeURIComponent(
      sessionId
    )}/${encodeURIComponent(
      userId
    )}`
  );

}


export function JamProvider({
  children,
}) {

  const socketRef =
    useRef(null);


  const [
    sessionId,
    setSessionId,
  ] = useState(null);


  const [
    userId,
    setUserId,
  ] = useState(null);


  const [
    isConnected,
    setIsConnected,
  ] = useState(false);


  const [
    isHost,
    setIsHost,
  ] = useState(false);


  const [
    participants,
    setParticipants,
  ] = useState([]);


  const [
    jamState,
    setJamState,
  ] = useState(
    INITIAL_JAM_STATE
  );


  // ==========================================================
  // CONNECT
  // ==========================================================

  const connectToJam =
    useCallback(
      (
        newSessionId,
        newUserId
      ) => {

        if (
          socketRef.current
        ) {

          socketRef.current.close();

          socketRef.current =
            null;

        }


        if (
          !newSessionId ||
          !newUserId
        ) {

          return;

        }
        
console.log(
  "[YOVI JAM] WebSocket URL:",
  getJamWebSocketUrl(
    newSessionId,
    newUserId
  )
);

        const socket =
          new WebSocket(
            getJamWebSocketUrl(
              newSessionId,
              newUserId
            )
          );


        socketRef.current =
          socket;


        socket.onopen = () => {

          console.log(
            "YOVI Jam connected:",
            newSessionId
          );


          setSessionId(
            newSessionId
          );


          setUserId(
            newUserId
          );


          setIsConnected(
            true
          );

        };


        socket.onmessage = (
          event
        ) => {

          try {

            const message =
              JSON.parse(
                event.data
              );


            console.log(
              "YOVI Jam event:",
              message
            );


            // ==================================================
            // SESSION STATE
            // ==================================================

            if (
              message.type ===
              "SESSION_STATE"
            ) {

              const session =
                message.session;


              if (!session) {

                return;

              }


              const incomingSong =
                session.current_song ??
                null;


              const incomingPlaying =
                Boolean(
                  session.is_playing
                );


              const incomingPosition =
                Number(
                  session.position ??
                  0
                );


              const incomingGuestPlayback =
                Boolean(
                  session.allow_guest_playback
                );


              const incomingGuestSongChange =
                Boolean(
                  session.allow_guest_song_change
                );


              const incomingGuestQueue =
                Boolean(
                  session.allow_guest_queue
                );


              setJamState({

                currentSong:
                  incomingSong,

                isPlaying:
                  incomingPlaying,

                position:
                  Number.isFinite(
                    incomingPosition
                  )
                    ? incomingPosition
                    : 0,

                allowGuestPlayback:
                  incomingGuestPlayback,

                allowGuestSongChange:
                  incomingGuestSongChange,

                allowGuestQueue:
                  incomingGuestQueue,

              });


              setParticipants(
                Array.isArray(
                  session.participants
                )
                  ? session.participants
                  : []
              );


              setIsHost(
                session.host_id ===
                newUserId
              );


              console.log(
                "YOVI Jam initial state:",
                {
                  song:
                    incomingSong,

                  playing:
                    incomingPlaying,

                  position:
                    incomingPosition,

                  allowGuestPlayback:
                    incomingGuestPlayback,

                  allowGuestSongChange:
                    incomingGuestSongChange,

                  allowGuestQueue:
                    incomingGuestQueue,
                }
              );


              return;

            }


            // ==================================================
            // PARTICIPANT JOINED
            // ==================================================

            if (
              message.type ===
              "PARTICIPANT_JOINED"
            ) {

              setParticipants(
                (previous) => {

                  if (
                    previous.includes(
                      message.user_id
                    )
                  ) {

                    return previous;

                  }


                  return [
                    ...previous,
                    message.user_id,
                  ];

                }
              );


              return;

            }


            // ==================================================
            // PARTICIPANT LEFT
            // ==================================================

            if (
              message.type ===
              "PARTICIPANT_LEFT"
            ) {

              setParticipants(
                (previous) =>
                  previous.filter(
                    (id) =>
                      id !==
                      message.user_id
                  )
              );


              return;

            }


            // ==================================================
            // PLAY
            // ==================================================

            if (
              message.type ===
              "PLAY"
            ) {

              const position =
                Number(
                  message.position ??
                  0
                );


              setJamState(
                (previous) => ({

                  ...previous,

                  isPlaying:
                    true,

                  position:
                    Number.isFinite(
                      position
                    )
                      ? position
                      : previous.position,

                })
              );


              return;

            }


            // ==================================================
            // PAUSE
            // ==================================================

            if (
              message.type ===
              "PAUSE"
            ) {

              const position =
                Number(
                  message.position ??
                  0
                );


              setJamState(
                (previous) => ({

                  ...previous,

                  isPlaying:
                    false,

                  position:
                    Number.isFinite(
                      position
                    )
                      ? position
                      : previous.position,

                })
              );


              return;

            }


            // ==================================================
            // SEEK
            // ==================================================

            if (
              message.type ===
              "SEEK"
            ) {

              const position =
                Number(
                  message.position ??
                  0
                );


              if (
                !Number.isFinite(
                  position
                )
              ) {

                return;

              }


              setJamState(
                (previous) => ({

                  ...previous,

                  position,

                })
              );


              return;

            }


            // ==================================================
            // SONG CHANGE
            // ==================================================

            if (
              message.type ===
              "SONG_CHANGE"
            ) {

              const position =
                Number(
                  message.position ??
                  0
                );


              setJamState(
                (previous) => ({

                  ...previous,

                  currentSong:
                    message.song ??
                    previous.currentSong,

                  isPlaying:
                    false,

                  position:
                    Number.isFinite(
                      position
                    )
                      ? position
                      : 0,

                })
              );


              return;

            }

          } catch (error) {

            console.error(
              "YOVI Jam message error:",
              error
            );

          }

        };


        socket.onerror = (
          error
        ) => {

          console.error(
            "YOVI Jam WebSocket error:",
            error
          );

        };


        socket.onclose = () => {

          console.log(
            "YOVI Jam disconnected"
          );


          setIsConnected(
            false
          );


          socketRef.current =
            null;

        };

      },
      []
    );


  // ==========================================================
  // DISCONNECT
  // ==========================================================

  const disconnectFromJam =
    useCallback(
      () => {

        if (
          socketRef.current
        ) {

          socketRef.current.close();

          socketRef.current =
            null;

        }


        setSessionId(
          null
        );


        setUserId(
          null
        );


        setIsConnected(
          false
        );


        setIsHost(
          false
        );


        setParticipants(
          []
        );


        setJamState({
          ...INITIAL_JAM_STATE,
        });

      },
      []
    );


  // ==========================================================
  // SEND EVENT
  // ==========================================================

  const sendEvent =
    useCallback(
      (event) => {

        const socket =
          socketRef.current;


        if (
          !socket ||
          socket.readyState !==
            WebSocket.OPEN
        ) {

          console.warn(
            "YOVI Jam is not connected"
          );


          return false;

        }


        socket.send(
          JSON.stringify(
            event
          )
        );


        return true;

      },
      []
    );


  // ==========================================================
  // UPDATE JAM PERMISSIONS
  // ==========================================================

  /*
   * IMPORTANT:
   *
   * Permission updates are now PARTIAL.
   *
   * Only the permission explicitly supplied by the caller
   * is changed.
   *
   * This prevents one toggle from accidentally resetting
   * another toggle because of stale React state.
   */

  const updateJamPermissions =
    useCallback(
      ({
        allowGuestPlayback,
        allowGuestSongChange,
        allowGuestQueue,
      }) => {

        if (!isHost) {

          console.warn(
            "[YOVI JAM] Only host can change permissions"
          );

          return false;

        }


        const event = {
          type:
            "SETTINGS_UPDATE",
        };


        if (
          typeof allowGuestPlayback ===
          "boolean"
        ) {

          event.allow_guest_playback =
            allowGuestPlayback;

        }


        if (
          typeof allowGuestSongChange ===
          "boolean"
        ) {

          event.allow_guest_song_change =
            allowGuestSongChange;

        }


        if (
          typeof allowGuestQueue ===
          "boolean"
        ) {

          event.allow_guest_queue =
            allowGuestQueue;

        }


        return sendEvent(
          event
        );

      },
      [
        isHost,
        sendEvent,
      ]
    );


  // ==========================================================
  // HOST / PERMITTED PLAY
  // ==========================================================

  const jamPlay =
    useCallback(
      (position = 0) => {

        if (
          !isHost &&
          !jamState.allowGuestPlayback
        ) {

          return false;

        }


        return sendEvent({

          type:
            "PLAY",

          position:
            Number(position) || 0,

        });

      },
      [
        isHost,
        jamState.allowGuestPlayback,
        sendEvent,
      ]
    );


  // ==========================================================
  // HOST / PERMITTED PAUSE
  // ==========================================================

  const jamPause =
    useCallback(
      (position = 0) => {

        if (
          !isHost &&
          !jamState.allowGuestPlayback
        ) {

          return false;

        }


        return sendEvent({

          type:
            "PAUSE",

          position:
            Number(position) || 0,

        });

      },
      [
        isHost,
        jamState.allowGuestPlayback,
        sendEvent,
      ]
    );


  // ==========================================================
  // HOST SEEK
  // ==========================================================

  const jamSeek =
    useCallback(
      (position) => {

        if (!isHost) {

          return false;

        }


        return sendEvent({

          type:
            "SEEK",

          position:
            Number(position) || 0,

        });

      },
      [
        isHost,
        sendEvent,
      ]
    );


  // ==========================================================
  // HOST / PERMITTED SONG CHANGE
  // ==========================================================

  const jamSongChange =
    useCallback(
      (
        song,
        position = 0
      ) => {

        if (
          !song
        ) {

          return false;

        }


        if (
          !isHost &&
          !jamState.allowGuestSongChange
        ) {

          return false;

        }


        return sendEvent({

          type:
            "SONG_CHANGE",

          song,

          position:
            Number(position) || 0,

        });

      },
      [
        isHost,
        jamState.allowGuestSongChange,
        sendEvent,
      ]
    );


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {

    return () => {

      if (
        socketRef.current
      ) {

        socketRef.current.close();

        socketRef.current =
          null;

      }

    };

  }, []);


  // ==========================================================
  // CONTEXT
  // ==========================================================

  const value = {

    sessionId,

    userId,

    isConnected,

    isHost,

    participants,

    jamState,

    connectToJam,

    disconnectFromJam,

    jamPlay,

    jamPause,

    jamSeek,

    jamSongChange,

    updateJamPermissions,

  };


  return (

    <JamContext.Provider
      value={value}
    >

      {children}

    </JamContext.Provider>

  );

}


export function useJam() {

  const context =
    useContext(
      JamContext
    );


  if (!context) {

    throw new Error(
      "useJam must be used inside JamProvider"
    );

  }


  return context;

}