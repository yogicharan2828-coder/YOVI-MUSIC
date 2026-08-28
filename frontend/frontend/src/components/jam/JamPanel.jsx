import {
  Check,
  Copy,
  LogOut,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useJam,
} from "../../context/JamContext";

import {
  usePlayer,
} from "../../context/PlayerContext";


const API_BASE_URL =
  "http://127.0.0.1:8000";


function ChartuneJamMark({
  size = 28,
}) {

  return (
    <span
      className="jam-brand-mark"
      aria-hidden="true"
    >

      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >

        <path
          d="
            M24.8 7.8
            C22.4 5.3 19 4 15.4 4
            C9.1 4 4 9.1 4 15.4
            C4 21.7 9.1 26.8 15.4 26.8
          "
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />

        <path
          d="
            M22.5 10
            C20.8 8.3 18.5 7.3 15.9 7.3
            C11.1 7.3 7.2 11.1 7.2 15.9
            C7.2 20.7 11.1 24.6 15.9 24.6
            C18.5 24.6 20.8 23.5 22.5 21.8
          "
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <circle
          cx="25.5"
          cy="8"
          r="2"
          fill="currentColor"
        />

        <circle
          cx="26.2"
          cy="24"
          r="1.45"
          fill="currentColor"
          opacity="0.7"
        />

        <path
          d="
            M23.8 13.2
            C26.2 14.2 27.8 16.5 27.8 19.1
          "
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.65"
        />

      </svg>

    </span>
  );

}


function JamPanel({
  onClose,
  initialSong = null,
}) {

  const {
    sessionId,
    userId,
    isConnected,
    isHost,
    participants,
    connectToJam,
    disconnectFromJam,
    jamState,
    jamSongChange,
  } = useJam();


  const {
    currentSong,
  } = usePlayer();


  const [joinCode, setJoinCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);


  const jamStartingSong =
    initialSong ||
    currentSong;


  // ==========================================================
  // USER ID
  // ==========================================================

  const getUserId = () => {

    let id =
      localStorage.getItem(
        "yovi_user_id"
      );


    if (!id) {

      id =
        `user-${Math.random()
          .toString(36)
          .slice(2, 10)}`;

      localStorage.setItem(
        "yovi_user_id",
        id
      );

    }


    return id;

  };


  // ==========================================================
  // CREATE JAM
  // ==========================================================

  const createJam = async () => {

    try {

      setLoading(true);

      setError("");


      const currentUserId =
        getUserId();


      const response =
        await fetch(
          `${API_BASE_URL}/jam/create`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              host_id:
                currentUserId,
            }),
          }
        );


      if (!response.ok) {

        throw new Error(
          `Create failed: ${response.status}`
        );

      }


      const data =
        await response.json();


      const createdSession =
        data.session?.session_id;


      if (!createdSession) {

        throw new Error(
          "No session ID returned"
        );

      }


      connectToJam(
        createdSession,
        currentUserId
      );

    } catch (err) {

      console.error(
        "Create Jam failed:",
        err
      );

      setError(
        err.message ||
        "Unable to create Jam"
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // SYNC INITIAL SONG INTO NEW JAM
  // ==========================================================

  useEffect(() => {

    if (
      !sessionId ||
      !isConnected ||
      !isHost ||
      !jamStartingSong
    ) {

      return;

    }


    /*
     * Only initialize the Jam song when the
     * Jam doesn't already have one.
     */

    if (
      jamState?.currentSong
    ) {

      return;

    }


    jamSongChange(
      jamStartingSong,
      0
    );

  }, [
    sessionId,
    isConnected,
    isHost,
    jamStartingSong,
    jamState?.currentSong,
  ]);


  // ==========================================================
  // JOIN JAM
  // ==========================================================

  const joinJam = async () => {

    try {

      setLoading(true);

      setError("");


      const normalizedCode =
        joinCode
          .trim()
          .toUpperCase();


      if (!normalizedCode) {

        setError(
          "Enter a Jam code."
        );

        setLoading(false);

        return;

      }


      const currentUserId =
        getUserId();


      const response =
        await fetch(
          `${API_BASE_URL}/jam/${encodeURIComponent(
            normalizedCode
          )}/join`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              user_id:
                currentUserId,
            }),
          }
        );


      if (!response.ok) {

        const data =
          await response
            .json()
            .catch(
              () => null
            );


        throw new Error(
          data?.detail ||
          `Join failed: ${response.status}`
        );

      }


      connectToJam(
        normalizedCode,
        currentUserId
      );

    } catch (err) {

      console.error(
        "Join Jam failed:",
        err
      );

      setError(
        err.message ||
        "Unable to join Jam"
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // COPY
  // ==========================================================

  const copyCode = async () => {

    if (!sessionId) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        sessionId
      );


      setCopied(true);


      setTimeout(() => {

        setCopied(false);

      }, 1500);

    } catch {

      setError(
        "Couldn't copy the Jam code."
      );

    }

  };


  // ==========================================================
  // LEAVE
  // ==========================================================

  const leaveJam = async () => {

    try {

      if (
        sessionId &&
        userId
      ) {

        await fetch(
          `${API_BASE_URL}/jam/${encodeURIComponent(
            sessionId
          )}/leave`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              user_id:
                userId,
            }),
          }
        );

      }

    } catch (err) {

      console.error(
        "Leave Jam failed:",
        err
      );

    } finally {

      disconnectFromJam();

    }

  };


  // ==========================================================
  // CURRENT SONG
  // ==========================================================

  const currentJamSong =
    jamState?.currentSong;


  // ==========================================================
  // ACTIVE SESSION
  // ==========================================================

  if (sessionId) {

    return (

      <div className="jam-overlay">

        <div className="jam-panel jam-panel-active">


          <div className="jam-header">

            <div className="jam-heading">

              <div className="jam-title-row">

                <div className="jam-title-mark">

                  <ChartuneJamMark
                    size={30}
                  />

                </div>

                <div>

                  <span className="jam-eyebrow">
                    CHARTUNE JAM
                  </span>

                  <h2>
                    Listening together.
                  </h2>

                </div>

              </div>

            </div>


            <button
              className="jam-close"
              onClick={onClose}
              aria-label="Close Jam"
            >

              <X size={19} />

            </button>

          </div>


          {/* CURRENT SONG */}

          <div className="jam-now-playing">

            <div className="jam-artwork">

              {currentJamSong?.image ? (

                <img
                  src={
                    currentJamSong.image
                  }
                  alt={
                    currentJamSong.title
                  }
                />

              ) : (

                <ChartuneJamMark
                  size={42}
                />

              )}

            </div>


            <div className="jam-song-details">

              <span className="jam-now-label">
                NOW LISTENING
              </span>


              <strong>
                {currentJamSong?.title ||
                  "Waiting for a song"}
              </strong>


              <span>
                {currentJamSong?.artist ||
                  "The host hasn't started playback yet"}
              </span>

            </div>

          </div>


          {/* LIVE */}

          <div className="jam-live-status">

            <div className="jam-live-left">

              <span
                className={
                  isConnected
                    ? "jam-live-dot active"
                    : "jam-live-dot"
                }
              />

              <span>
                {isConnected
                  ? "SYNCED"
                  : "CONNECTING"}
              </span>

            </div>


            <div className="jam-live-right">

              <Users size={14} />

              <span>
                {participants.length}
              </span>

              <span>
                LISTENING
              </span>

            </div>

          </div>


          {/* SESSION */}

          <div className="jam-session-card">

            <div className="jam-session-label">
              JAM CODE
            </div>


            <div className="jam-code-row">

              <strong>
                {sessionId}
              </strong>


              <button
                className={
                  copied
                    ? "jam-copy copied"
                    : "jam-copy"
                }
                onClick={copyCode}
                aria-label="Copy Jam code"
                title="Copy Jam code"
              >

                {copied ? (
                  <Check size={17} />
                ) : (
                  <Copy size={17} />
                )}

              </button>

            </div>


            <p>
              Share this code with friends
              to listen together.
            </p>

          </div>


          {/* PARTICIPANTS */}

          <div className="jam-participants">

            <div className="jam-section-title">

              <span>
                LISTENING TOGETHER
              </span>

              <span>
                {participants.length}
              </span>

            </div>


            <div className="jam-list">

              {participants.map(
                (
                  participant,
                  index
                ) => {

                  const isCurrentUser =
                    participant ===
                    userId;

                  const participantIsHost =
                    isCurrentUser &&
                    isHost;


                  return (

                    <div
                      className="jam-participant"
                      key={participant}
                    >

                      <div className="jam-avatar">

                        <span>
                          {isCurrentUser
                            ? "Y"
                            : String(
                                index + 1
                              )}
                        </span>

                      </div>


                      <div className="jam-participant-info">

                        <span className="jam-participant-name">

                          {isCurrentUser
                            ? "You"
                            : participant}

                        </span>


                        {participantIsHost && (

                          <span className="jam-participant-role">
                            HOST
                          </span>

                        )}

                      </div>


                      {isCurrentUser && (

                        <span className="jam-you-badge">
                          YOU
                        </span>

                      )}

                    </div>

                  );

                }
              )}

            </div>

          </div>


          {/* LEAVE */}

          <button
            className="jam-leave"
            onClick={leaveJam}
          >

            <LogOut size={16} />

            Leave Jam

          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // CREATE / JOIN
  // ==========================================================

  return (

    <div className="jam-overlay">

      <div className="jam-panel">


        <div className="jam-header">

          <div className="jam-heading">

            <div className="jam-title-row">

              <div className="jam-title-mark">

                <ChartuneJamMark
                  size={30}
                />

              </div>

              <div>

                <span className="jam-eyebrow">
                  CHARTUNE JAM
                </span>

                <h2>
                  Listen together.
                </h2>

              </div>

            </div>


            <p>
              Create a shared listening
              room or join a friend's Jam.
            </p>

          </div>


          <button
            className="jam-close"
            onClick={onClose}
            aria-label="Close Jam"
          >

            <X size={19} />

          </button>

        </div>


        <button
          className="jam-create"
          onClick={createJam}
          disabled={loading}
        >

          <ChartuneJamMark
            size={21}
          />

          {loading
            ? "CREATING..."
            : "CREATE A JAM"}

        </button>


        <div className="jam-divider">

          <span>
            OR JOIN AN EXISTING JAM
          </span>

        </div>


        <div className="jam-join">

          <label>
            JAM CODE
          </label>


          <div className="jam-input-row">

            <input
              type="text"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(
                  event.target.value
                    .toUpperCase()
                )
              }
              placeholder="YOVI-XXXXXX"
              maxLength={11}
              onKeyDown={(event) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  joinJam();

                }

              }}
            />


            <button
              onClick={joinJam}
              disabled={
                loading ||
                !joinCode.trim()
              }
            >
              JOIN
            </button>

          </div>

        </div>


        {error && (

          <div className="jam-error">
            {error}
          </div>

        )}


        <div className="jam-info">

          <ChartuneJamMark
            size={20}
          />

          <span>
            Everyone hears the same song,
            in sync, together.
          </span>

        </div>

      </div>

    </div>

  );

}


export default JamPanel;