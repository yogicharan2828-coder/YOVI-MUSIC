import {
  ArrowLeft,
  X,
} from "lucide-react";

import {
  useJam,
} from "../../context/JamContext";


function JamSettings({
  onClose,
}) {

  const {
    isHost,
    jamState,
    updateJamPermissions,
  } = useJam();


  // ==========================================================
  // CURRENT PERMISSIONS
  // ==========================================================

  const allowGuestPlayback =
    Boolean(
      jamState?.allowGuestPlayback
    );


  const allowGuestSongChange =
    Boolean(
      jamState?.allowGuestSongChange
    );


  const allowGuestQueue =
    Boolean(
      jamState?.allowGuestQueue
    );


  // ==========================================================
  // PLAYBACK CONTROL
  // ==========================================================

  const handlePlaybackToggle = () => {

    if (!isHost) {

      return;

    }


    updateJamPermissions({

      allowGuestPlayback:
        !allowGuestPlayback,

    });

  };


  // ==========================================================
  // SONG CONTROL
  // ==========================================================

  const handleSongChangeToggle = () => {

    if (!isHost) {

      return;

    }


    updateJamPermissions({

      allowGuestSongChange:
        !allowGuestSongChange,

    });

  };


  // ==========================================================
  // QUEUE CONTROL
  // ==========================================================

  const handleQueueToggle = () => {

    if (!isHost) {

      return;

    }


    updateJamPermissions({

      allowGuestQueue:
        !allowGuestQueue,

    });

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="jam-settings-overlay">

      <div className="jam-settings-panel">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="jam-settings-header">

          <button
            type="button"
            className="jam-settings-back"
            onClick={onClose}
            aria-label="Back to Jam"
            title="Back"
          >

            <ArrowLeft
              size={19}
            />

          </button>


          <div>

            <span className="jam-eyebrow">
              CHARTUNE JAM
            </span>

            <h2>
              Jam Settings
            </h2>

          </div>


          <button
            type="button"
            className="jam-settings-close"
            onClick={onClose}
            aria-label="Close settings"
            title="Close"
          >

            <X
              size={19}
            />

          </button>

        </div>


        {/* ==================================================
            GUEST PERMISSIONS
        ================================================== */}

        <div className="jam-settings-section">

          <span className="jam-settings-section-title">
            GUEST PERMISSIONS
          </span>


          {/* ==================================================
              PLAYBACK CONTROL
          ================================================== */}

          <div className="jam-setting-row">

            <div className="jam-setting-info">

              <strong>
                Playback control
              </strong>

              <span>
                Allow guests to play and
                pause the current song.
              </span>

            </div>


            <button
              type="button"
              className={
                allowGuestPlayback
                  ? "jam-toggle active"
                  : "jam-toggle"
              }
              onClick={
                handlePlaybackToggle
              }
              aria-pressed={
                allowGuestPlayback
              }
              aria-label={
                allowGuestPlayback
                  ? "Disable guest playback control"
                  : "Enable guest playback control"
              }
            >

              <span className="jam-toggle-track">

                <span className="jam-toggle-thumb" />

              </span>

            </button>

          </div>


          {/* ==================================================
              SONG CONTROL
          ================================================== */}

          <div className="jam-setting-row">

            <div className="jam-setting-info">

              <strong>
                Song control
              </strong>

              <span>
                Allow guests to change
                the currently playing song.
              </span>

            </div>


            <button
              type="button"
              className={
                allowGuestSongChange
                  ? "jam-toggle active"
                  : "jam-toggle"
              }
              onClick={
                handleSongChangeToggle
              }
              aria-pressed={
                allowGuestSongChange
              }
              aria-label={
                allowGuestSongChange
                  ? "Disable guest song control"
                  : "Enable guest song control"
              }
            >

              <span className="jam-toggle-track">

                <span className="jam-toggle-thumb" />

              </span>

            </button>

          </div>


          {/* ==================================================
              QUEUE & PLAYLIST
          ================================================== */}

          <div className="jam-setting-row">

            <div className="jam-setting-info">

              <strong>
                Queue & Playlist
              </strong>

              <span>
                Allow guests to add songs
                to the Jam queue and playlist.
              </span>

            </div>


            <button
              type="button"
              className={
                allowGuestQueue
                  ? "jam-toggle active"
                  : "jam-toggle"
              }
              onClick={
                handleQueueToggle
              }
              aria-pressed={
                allowGuestQueue
              }
              aria-label={
                allowGuestQueue
                  ? "Disable guest queue and playlist access"
                  : "Enable guest queue and playlist access"
              }
            >

              <span className="jam-toggle-track">

                <span className="jam-toggle-thumb" />

              </span>

            </button>

          </div>

        </div>


        {/* ==================================================
            CURRENT STATE
        ================================================== */}

        <div className="jam-settings-note">

          <span>

            {allowGuestPlayback &&
            allowGuestSongChange &&
            allowGuestQueue

              ? "Guests have full Jam control."

              : allowGuestPlayback &&
                allowGuestSongChange

              ? "Guests can control playback and change songs."

              : allowGuestPlayback &&
                allowGuestQueue

              ? "Guests can control playback and add songs."

              : allowGuestSongChange &&
                allowGuestQueue

              ? "Guests can change songs and add songs."

              : allowGuestPlayback

              ? "Guests can play and pause."

              : allowGuestSongChange

              ? "Guests can change the current song."

              : allowGuestQueue

              ? "Guests can add songs to the Jam."

              : "Only the host can control the Jam."

            }

          </span>

        </div>

      </div>

    </div>

  );

}


export default JamSettings;