import {
  Check,
  Ellipsis,
  ListMusic,
  Play,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import { usePlayer } from "../../context/PlayerContext";

import useSongActions from "../../hooks/useSongActions";

import SongActionMenu from "./SongActionMenu";


function QueuePanel({ onClose }) {

  const {
    currentSong,
    queue,
    currentIndex,
    playSong,

    isFavorite,
    isInLibrary,
  } = usePlayer();


  const {
    performSongAction,
  } = useSongActions();


  const [
    actionSong,
    setActionSong,
  ] = useState(null);


  const [
    actionMessage,
    setActionMessage,
  ] = useState("");


  // ==========================================================
  // PLAY QUEUED SONG
  // ==========================================================

  const handlePlaySong = async (
    event,
    song,
    index
  ) => {

    event.stopPropagation();


    if (!song) {
      return;
    }


    if (
      index === currentIndex
    ) {

      onClose();

      return;

    }


    await playSong(
      song,
      queue
    );


    onClose();

  };


  // ==========================================================
  // ACTION MENU
  // ==========================================================

  const openActions = (
    event,
    song
  ) => {

    event.stopPropagation();

    setActionSong(
      song
    );

  };


  const handleAction = async (
    action
  ) => {

    if (!actionSong) {
      return;
    }


    const message =
      await performSongAction(
        action,
        actionSong
      );


    setActionSong(
      null
    );


    if (message) {

      setActionMessage(
        message
      );


      window.setTimeout(
        () => {
          setActionMessage("");
        },
        1800
      );

    }

  };


  // ==========================================================
  // EMPTY
  // ==========================================================

  if (!queue.length) {

    return (

      <div className="queue-overlay">

        <div className="queue-panel">

          <div className="queue-header">

            <div className="queue-title">

              <ListMusic size={20} />

              <div>

                <span>
                  CHARTUNE
                </span>

                <h2>
                  Up Next
                </h2>

              </div>

            </div>


            <button
              className="queue-close"
              onClick={onClose}
              aria-label="Close queue"
            >

              <X size={19} />

            </button>

          </div>


          <div className="queue-empty">

            <ListMusic
              size={34}
              strokeWidth={1.2}
            />

            <strong>
              Your queue is empty
            </strong>

            <span>
              Add songs to start building
              your listening queue.
            </span>

          </div>

        </div>

      </div>

    );

  }


  const upcomingSongs =
    queue.slice(
      currentIndex + 1
    );


  return (

    <div
      className="queue-overlay"
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {

          onClose();

        }

      }}
    >

      <div className="queue-panel">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="queue-header">

          <div className="queue-title">

            <div className="queue-title-icon">

              <ListMusic
                size={18}
              />

            </div>

            <div>

              <span>
                CHARTUNE QUEUE
              </span>

              <h2>
                Up Next
              </h2>

            </div>

          </div>


          <button
            className="queue-close"
            onClick={onClose}
            aria-label="Close queue"
          >

            <X size={19} />

          </button>

        </div>


        {/* ==================================================
            NOW PLAYING
        ================================================== */}

        {currentSong && (

          <section className="queue-current">

            <div className="queue-section-label">
              NOW PLAYING
            </div>


            <div className="queue-current-song">

              <div className="queue-artwork">

                {currentSong.image ? (

                  <img
                    src={
                      currentSong.image
                    }
                    alt={
                      currentSong.title
                    }
                  />

                ) : (

                  <ListMusic
                    size={22}
                  />

                )}

              </div>


              <div className="queue-song-info">

                <strong>
                  {currentSong.title}
                </strong>

                <span>
                  {currentSong.artist}
                </span>

              </div>


              <div className="queue-playing-indicator">

                <span />
                <span />
                <span />

              </div>

            </div>

          </section>

        )}


        {/* ==================================================
            UPCOMING
        ================================================== */}

        <section className="queue-upcoming">

          <div className="queue-section-header">

            <span className="queue-section-label">
              UP NEXT
            </span>

            <span className="queue-count">
              {upcomingSongs.length}
            </span>

          </div>


          {upcomingSongs.length > 0 ? (

            <div className="queue-list">

              {upcomingSongs.map(
                (song, relativeIndex) => {

                  const actualIndex =
                    currentIndex +
                    1 +
                    relativeIndex;


                  return (

                    <div
                      className="queue-item"
                      key={`${song.id ?? song.title}-${actualIndex}`}
                      onClick={() =>
                        playSong(
                          song,
                          queue
                        )
                      }
                    >

                      <div className="queue-item-number">
                        {relativeIndex + 1}
                      </div>


                      <div className="queue-item-artwork">

                        {song.image ? (

                          <img
                            src={
                              song.image
                            }
                            alt={
                              song.title
                            }
                          />

                        ) : (

                          <ListMusic
                            size={16}
                          />

                        )}

                      </div>


                      <div className="queue-item-info">

                        <strong>
                          {song.title}
                        </strong>

                        <span>
                          {song.artist}
                        </span>

                      </div>


                      <button
                        type="button"
                        className="queue-item-play"
                        onClick={(event) =>
                          handlePlaySong(
                            event,
                            song,
                            actualIndex
                          )
                        }
                        aria-label={`Play ${song.title}`}
                      >

                        <Play
                          size={14}
                          fill="currentColor"
                        />

                      </button>


                      <button
                        type="button"
                        className="queue-item-more"
                        onClick={(event) =>
                          openActions(
                            event,
                            song
                          )
                        }
                        aria-label={`More options for ${song.title}`}
                        title="More options"
                      >

                        <Ellipsis
                          size={17}
                        />

                      </button>

                    </div>

                  );

                }
              )}

            </div>

          ) : (

            <div className="queue-finished">

              <Check size={16} />

              <span>
                End of queue
              </span>

            </div>

          )}

        </section>


        {/* ==================================================
            TOTAL
        ================================================== */}

        <div className="queue-footer">

          <span>
            {queue.length}{" "}
            {queue.length === 1
              ? "SONG"
              : "SONGS"}{" "}
            IN QUEUE
          </span>

        </div>


        {actionMessage && (

          <div className="queue-action-toast">
            {actionMessage}
          </div>

        )}


        {actionSong && (

          <SongActionMenu

            song={
              actionSong
            }

            isFavorite={
              isFavorite(
                actionSong
              )
            }

            isInLibrary={
              isInLibrary(
                actionSong
              )
            }

            onClose={() =>
              setActionSong(
                null
              )
            }

            onAction={
              handleAction
            }

          />

        )}

      </div>

    </div>

  );

}


export default QueuePanel;
