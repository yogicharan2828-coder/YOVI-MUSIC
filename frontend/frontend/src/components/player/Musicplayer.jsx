import {
  FileText,
  Heart,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePlayer,
} from "../../context/PlayerContext";

import LyricsPanel from "./LyricsPanel";
import QueuePanel from "./QueuePanel";
import NowPlaying from "./NowPlaying";


function formatTime(seconds) {

  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {

    return "0:00";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remainingSeconds =
    Math.floor(
      seconds % 60
    );


  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;

}


function MusicPlayer({
  onJam,
  onNowPlayingChange,
}) {

  const {

    currentSong,

    isPlaying,
    isLoading,

    currentTime,
    duration,
    volume,

    togglePlay,
    playNext,
    playPrevious,

    seekTo,
    changeVolume,

    jamConnected,
    isHost,

    isFavorite,
    addToFavorites,
    removeFromFavorites,

  } = usePlayer();


  // ==========================================================
  // LOCAL UI STATE
  // ==========================================================

  const [
    lyricsOpen,
    setLyricsOpen,
  ] = useState(false);


  const [
    queueOpen,
    setQueueOpen,
  ] = useState(false);


  const [
    nowPlayingOpen,
    setNowPlayingOpen,
  ] = useState(false);


  // ==========================================================
  // NOW PLAYING VISIBILITY
  // ==========================================================

  useEffect(() => {

    if (
      onNowPlayingChange
    ) {

      onNowPlayingChange(
        nowPlayingOpen
      );

    }

  }, [
    nowPlayingOpen,
    onNowPlayingChange,
  ]);


  // ==========================================================
  // EMPTY PLAYER
  // ==========================================================

  if (!currentSong) {

    return (

      <div className="music-player empty-player">

        <div className="empty-player-message">
          Select a song to start listening
        </div>

      </div>

    );

  }


  // ==========================================================
  // FAVORITE
  // ==========================================================

  const favorite =
    isFavorite(
      currentSong
    );


  // ==========================================================
  // PROGRESS
  // ==========================================================

  const progress =
    duration > 0
      ? Math.min(
          (
            currentTime /
            duration
          ) * 100,
          100
        )
      : 0;


  // ==========================================================
  // SEEK
  // ==========================================================

  const handleSeek = (
    event
  ) => {

    const value =
      Number(
        event.target.value
      );


    if (
      !Number.isFinite(
        value
      )
    ) {

      return;

    }


    seekTo(
      value
    );

  };


  // ==========================================================
  // FAVORITE
  // ==========================================================

  const handleFavorite = (
    event
  ) => {

    event.stopPropagation();


    if (favorite) {

      removeFromFavorites(
        currentSong
      );

    } else {

      addToFavorites(
        currentSong
      );

    }

  };


  // ==========================================================
  // PLAY / PAUSE
  // ==========================================================

  const handlePlay = (
    event
  ) => {

    event.stopPropagation();

    /*
     * Do not disable this button based on
     * duration or YouTube video ID.
     *
     * PlayerContext owns the YouTube
     * readiness and playback logic.
     */

    togglePlay();

  };


  // ==========================================================
  // NOW PLAYING
  // ==========================================================

  const openNowPlaying = () => {

    setNowPlayingOpen(
      true
    );

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <>

      {/* ==================================================
          COMPACT PLAYER
      ================================================== */}

  <div
  className="music-player"
  onClick={openNowPlaying}
>


        {/* =================================================
            SONG
        ================================================= */}

        <div
          className="player-song"
          onClick={
            openNowPlaying
          }
          role="button"
          tabIndex={0}
          onKeyDown={(
            event
          ) => {

            if (
              event.key === "Enter" ||
              event.key === " "
            ) {

              event.preventDefault();

              openNowPlaying();

            }

          }}
        >

          <img
            src={
              currentSong.image
            }
            alt={
              currentSong.title
            }
          />


          <div className="player-song-info">

            <strong>
              {currentSong.title}
            </strong>

            <span>
              {currentSong.artist}
            </span>

          </div>


          <button
            className={
              favorite
                ? "player-like active"
                : "player-like"
            }
            aria-label={
              favorite
                ? "Remove from liked songs"
                : "Add to liked songs"
            }
            title={
              favorite
                ? "Remove from liked songs"
                : "Add to liked songs"
            }
            onClick={
              handleFavorite
            }
            type="button"
          >

            <Heart
              size={17}
              fill={
                favorite
                  ? "currentColor"
                  : "none"
              }
            />

          </button>

        </div>


        {/* =================================================
            MAIN PLAYER
        ================================================= */}

        <div
  className="player-main"
  onClick={(event) =>
    event.stopPropagation()
  }
>


          {/* =================================================
              CONTROLS
          ================================================= */}

          <div className="player-controls">


            {/* PREVIOUS */}

            <button
              onClick={
                playPrevious
              }
              aria-label="Previous song"
              title="Previous"
              type="button"
            >

              <SkipBack
                size={17}
              />

            </button>


            {/* PLAY / PAUSE */}

            <button
              className={
                isLoading
                  ? "player-play loading"
                  : "player-play"
              }
              onClick={
                handlePlay
              }
              type="button"
              aria-label={
                isPlaying
                  ? "Pause"
                  : "Play"
              }
              title={
                isPlaying
                  ? "Pause"
                  : "Play"
              }
            >

              {isLoading ? (

                <span className="player-loader">
                  ...
                </span>

              ) : isPlaying ? (

                <Pause
                  size={17}
                  fill="currentColor"
                />

              ) : (

                <Play
                  size={17}
                  fill="currentColor"
                />

              )}

            </button>


            {/* NEXT */}

            <button
              onClick={
                playNext
              }
              aria-label="Next song"
              title="Next"
              type="button"
            >

              <SkipForward
                size={17}
              />

            </button>

          </div>


          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="player-progress">

            <span>
              {formatTime(
                currentTime
              )}
            </span>


            <input
              className="progress-slider"
              type="range"
              min="0"
              max={
                duration || 0
              }
              step="0.1"
              value={Math.min(
                currentTime,
                duration || 0
              )}
              onChange={
                handleSeek
              }
              style={{
                "--progress":
                  `${progress}%`,
              }}
              disabled={
                !duration
              }
              aria-label="Song progress"
            />


            <span>
              {formatTime(
                duration
              )}
            </span>

          </div>


          {/* =================================================
              JAM STATUS
          ================================================= */}

          {jamConnected && (

            <div className="player-jam-status">

              <span
                className={
                  isHost
                    ? "player-jam-dot host"
                    : "player-jam-dot"
                }
              />

              <span>
                {isHost
                  ? "JAM HOST"
                  : "JAM SYNCED"}
              </span>

            </div>

          )}

        </div>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
  className="player-actions"
  onClick={(event) =>
    event.stopPropagation()
  }
>


          {/* LYRICS */}

          <button
            aria-label="Lyrics"
            title="Lyrics"
            type="button"
            onClick={() =>
              setLyricsOpen(
                true
              )
            }
          >

            <FileText
              size={18}
            />

          </button>


          {/* QUEUE */}

          <button
            className={
              queueOpen
                ? "player-action-active"
                : ""
            }
            aria-label="Queue"
            title="Queue"
            type="button"
            onClick={() =>
              setQueueOpen(
                true
              )
            }
          >

            <ListMusic
              size={18}
            />

          </button>


          {/* VOLUME */}

          <button
            aria-label="Volume"
            title="Volume"
            type="button"
          >

            <Volume2
              size={18}
            />

          </button>


          <input
            className="volume-slider"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(
              event
            ) =>
              changeVolume(
                event.target.value
              )
            }
            style={{
              "--volume":
                `${volume}%`,
            }}
            aria-label="Volume"
          />

        </div>

      </div>


      {/* ==================================================
          LYRICS
      ================================================== */}

      {lyricsOpen && (

        <LyricsPanel
          onClose={() =>
            setLyricsOpen(
              false
            )
          }
        />

      )}


      {/* ==================================================
          QUEUE
      ================================================== */}

      {queueOpen && (

        <QueuePanel
          onClose={() =>
            setQueueOpen(
              false
            )
          }
        />

      )}


      {/* ==================================================
          NOW PLAYING
      ================================================== */}

      {nowPlayingOpen && (

        <NowPlaying

          onClose={() =>
            setNowPlayingOpen(
              false
            )
          }

          onQueue={() =>
            setQueueOpen(
              true
            )
          }

          onLyrics={() =>
            setLyricsOpen(
              true
            )
          }

          onJam={
            onJam
          }

        />

      )}

    </>

  );

}


export default MusicPlayer;