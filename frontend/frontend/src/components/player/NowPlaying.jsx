import {
  ChevronDown,
  Ellipsis,
  Heart,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePlayer,
} from "../../context/PlayerContext";

import useJamControl from "../../hooks/useJamControl";

import SongActionMenu from "./SongActionMenu";


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


function NowPlaying({
  onClose,
  onQueue,
  onLyrics,
  onJam,
}) {

  const {

    currentSong,

    youtubeVideoId,

    isPlaying,
    isLoading,

    currentTime,
    duration,

    togglePlay,
    playNext,
    playPrevious,

    seekTo,

    addToQueue,
    playNextSong,

    addToLibrary,
    isInLibrary,

    addToFavorites,
    removeFromFavorites,
    isFavorite,

    playlists,
    createPlaylist,
    addToPlaylist,

  } = usePlayer();


  // ==========================================================
  // JAM CONTROL PERMISSIONS
  // ==========================================================

  const {
    canPlayPause,
    canSeek,
    canSkip,
    isJamGuest,
  } = useJamControl();


  const [
    actionMenuOpen,
    setActionMenuOpen,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  useEffect(() => {

    const handleKeyDown = (
      event
    ) => {

      /*
       * Escape is intentionally NOT used
       * to close the panel.
       */

      if (
        event.key === "Escape"
      ) {

        /*
         * Intentionally do nothing.
         */

      }

    };


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, []);


  if (!currentSong) {

    return null;

  }


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


    if (
      !canSeek
    ) {

      return;

    }


    seekTo(
      value
    );

  };


  // ==========================================================
  // PLAY / PAUSE
  // ==========================================================

  const handlePlay = () => {

    if (
      !canPlayPause
    ) {

      return;

    }


    togglePlay();

  };


  // ==========================================================
  // PREVIOUS
  // ==========================================================

  const handlePrevious = () => {

    if (
      !canSkip
    ) {

      return;

    }


    playPrevious();

  };


  // ==========================================================
  // NEXT
  // ==========================================================

  const handleNext = () => {

    if (
      !canSkip
    ) {

      return;

    }


    playNext();

  };


  // ==========================================================
  // MESSAGE
  // ==========================================================

  const showMessage = (
    text
  ) => {

    setMessage(
      text
    );


    window.setTimeout(
      () => {

        setMessage("");

      },
      2200
    );

  };


  // ==========================================================
  // FAVORITE
  // ==========================================================

  const handleFavorite = () => {

    if (
      isFavorite(
        currentSong
      )
    ) {

      removeFromFavorites(
        currentSong
      );


      showMessage(
        "Removed from liked songs"
      );

    } else {

      addToFavorites(
        currentSong
      );


      showMessage(
        "Added to liked songs"
      );

    }

  };


  // ==========================================================
  // LIBRARY
  // ==========================================================

  const handleLibrary = () => {

    if (
      isInLibrary(
        currentSong
      )
    ) {

      showMessage(
        "Already in your library"
      );


      setActionMenuOpen(
        false
      );


      return;

    }


    addToLibrary(
      currentSong
    );


    showMessage(
      "Added to your library"
    );


    setActionMenuOpen(
      false
    );

  };


  // ==========================================================
  // PLAYLIST
  // ==========================================================

  const handlePlaylist = () => {

    const playlistNames =
      Object.keys(
        playlists ?? {}
      );


    if (
      playlistNames.length === 0
    ) {

      const name =
        window.prompt(
          "Create a playlist"
        );


      if (
        !name?.trim()
      ) {

        return;

      }


      const cleanName =
        name.trim();


      const created =
        createPlaylist(
          cleanName
        );


      if (!created) {

        showMessage(
          "Playlist already exists"
        );


        return;

      }


      addToPlaylist(
        cleanName,
        currentSong
      );


      showMessage(
        `Added to ${cleanName}`
      );


      setActionMenuOpen(
        false
      );


      return;

    }


    const options =
      playlistNames
        .map(
          (name, index) =>
            `${index + 1}. ${name}`
        )
        .join("\n");


    const selected =
      window.prompt(
        `Add to playlist:\n\n${options}\n\nType an existing playlist name or enter a new name:`
      );


    if (
      !selected?.trim()
    ) {

      return;

    }


    const cleanName =
      selected.trim();


    if (
      !Object.prototype.hasOwnProperty.call(
        playlists,
        cleanName
      )
    ) {

      const shouldCreate =
        window.confirm(
          `"${cleanName}" doesn't exist.\n\nCreate it?`
        );


      if (!shouldCreate) {

        return;

      }


      const created =
        createPlaylist(
          cleanName
        );


      if (!created) {

        showMessage(
          "Unable to create playlist"
        );


        return;

      }

    }


    addToPlaylist(
      cleanName,
      currentSong
    );


    showMessage(
      `Added to ${cleanName}`
    );


    setActionMenuOpen(
      false
    );

  };


  // ==========================================================
  // QUEUE
  // ==========================================================

  const handleQueue = () => {

    addToQueue(
      currentSong
    );


    showMessage(
      "Added to queue"
    );


    setActionMenuOpen(
      false
    );

  };


  // ==========================================================
  // PLAY NEXT
  // ==========================================================

  const handlePlayNext = () => {

    playNextSong(
      currentSong
    );


    showMessage(
      "Playing next"
    );


    setActionMenuOpen(
      false
    );

  };


  // ==========================================================
  // JAM
  // ==========================================================

  const handleJam = () => {

    setActionMenuOpen(
      false
    );


    if (onJam) {

      onJam();

    }

  };


  // ==========================================================
  // SHARE
  // ==========================================================

  const handleShare = async () => {

    const shareUrl =
      window.location.href;


    const shareData = {

      title:
        currentSong.title,

      text:
        `${currentSong.title} — ${currentSong.artist}`,

      url:
        shareUrl,

    };


    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData
        );


        setActionMenuOpen(
          false
        );


        return;

      }


      if (
        navigator.clipboard
      ) {

        await navigator.clipboard.writeText(
          shareUrl
        );


        showMessage(
          "Song link copied"
        );

      } else {

        showMessage(
          "Sharing is not supported"
        );

      }

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {

        return;

      }


      showMessage(
        "Unable to share this song"
      );

    }


    setActionMenuOpen(
      false
    );

  };


  // ==========================================================
  // ACTION DISPATCHER
  // ==========================================================

  const handleSongAction = (
    action
  ) => {

    switch (
      action
    ) {

      case "library":
        handleLibrary();
        break;

      case "playlist":
        handlePlaylist();
        break;

      case "queue":
        handleQueue();
        break;

      case "jam":
        handleJam();
        break;

      case "play-next":
        handlePlayNext();
        break;

      case "share":
        handleShare();
        break;

      case "download":

        showMessage(
          "Download is not available for this track"
        );

        setActionMenuOpen(
          false
        );

        break;

      default:

        setActionMenuOpen(
          false
        );

    }

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="now-playing-overlay">


      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="now-playing-topbar">

        <button
          className="now-playing-close"
          onClick={
            onClose
          }
          aria-label="Close now playing"
          title="Close"
        >

          <ChevronDown
            size={24}
          />

        </button>


        <span className="now-playing-label">
          NOW PLAYING
        </span>


        <button
          className="now-playing-menu"
          onClick={() =>
            setActionMenuOpen(
              true
            )
          }
          aria-label="Song options"
          title="Song options"
        >

          <Ellipsis
            size={22}
          />

        </button>

      </div>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="now-playing-content">


        {/* =================================================
            VISUAL
        ================================================= */}

        <div
          className={
            youtubeVideoId
              ? "now-playing-visual has-video"
              : "now-playing-visual"
          }
        >

          {currentSong.image && (

            <img
              src={
                currentSong.image
              }
              alt={
                currentSong.title
              }
              className="now-playing-artwork"
            />

          )}

        </div>


        {/* =================================================
            SONG INFO
        ================================================= */}

        <div className="now-playing-song">

          <div className="now-playing-song-text">

            <h1>
              {currentSong.title}
            </h1>


            <p>
              {currentSong.artist}
            </p>

          </div>


          <button
            className={
              isFavorite(
                currentSong
              )
                ? "now-playing-like active"
                : "now-playing-like"
            }
            aria-label={
              isFavorite(
                currentSong
              )
                ? "Remove from liked songs"
                : "Add to liked songs"
            }
            title={
              isFavorite(
                currentSong
              )
                ? "Remove from liked songs"
                : "Add to liked songs"
            }
            onClick={
              handleFavorite
            }
            type="button"
          >

            <Heart
              size={22}
              fill={
                isFavorite(
                  currentSong
                )
                  ? "currentColor"
                  : "none"
              }
            />

          </button>

        </div>


        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="now-playing-progress">

          <input
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
              !duration ||
              !canSeek
            }
            aria-label="Song progress"
          />


          <div className="now-playing-times">

            <span>
              {formatTime(
                currentTime
              )}
            </span>


            <span>
              {formatTime(
                duration
              )}
            </span>

          </div>

        </div>


        {/* =================================================
            CONTROLS
        ================================================= */}

        <div className="now-playing-controls">


          {/* PREVIOUS */}

          <button
            onClick={
              handlePrevious
            }
            disabled={
              !canSkip
            }
            aria-label="Previous song"
            title={
              canSkip
                ? "Previous song"
                : "Only the host can control Jam playback"
            }
            type="button"
          >

            <SkipBack
              size={24}
            />

          </button>


          {/* PLAY / PAUSE */}

          <button
            className="now-playing-play"
            onClick={
              handlePlay
            }
            disabled={
              isLoading ||
              !canPlayPause
            }
            aria-label={
              isJamGuest
                ? "Only the host can control Jam playback"
                : isPlaying
                  ? "Pause"
                  : "Play"
            }
            title={
              isJamGuest
                ? "Only the host can control Jam playback"
                : isPlaying
                  ? "Pause"
                  : "Play"
            }
            type="button"
          >

            {isLoading ? (

              <span>
                ...
              </span>

            ) : isPlaying ? (

              <Pause
                size={25}
                fill="currentColor"
              />

            ) : (

              <Play
                size={25}
                fill="currentColor"
              />

            )}

          </button>


          {/* NEXT */}

          <button
            onClick={
              handleNext
            }
            disabled={
              !canSkip
            }
            aria-label="Next song"
            title={
              canSkip
                ? "Next song"
                : "Only the host can control Jam playback"
            }
            type="button"
          >

            <SkipForward
              size={24}
            />

          </button>

        </div>


        {/* =================================================
            GUEST MESSAGE
        ================================================= */}

        {isJamGuest && (

          <div className="now-playing-jam-notice">

            HOST CONTROLS PLAYBACK

          </div>

        )}


        {/* =================================================
            SECONDARY ACTIONS
        ================================================= */}

        <div className="now-playing-actions">

          <button
            onClick={() =>
              setActionMenuOpen(
                true
              )
            }
            aria-label="Song options"
            title="Song options"
            type="button"
          >

            <Ellipsis
              size={20}
            />

            <span>
              MORE
            </span>

          </button>


          <button
            onClick={
              onQueue
            }
            aria-label="Queue"
            title="Queue"
            type="button"
          >

            <ListMusic
              size={20}
            />

            <span>
              QUEUE
            </span>

          </button>


          <button
            onClick={
              onLyrics
            }
            aria-label="Lyrics"
            title="Lyrics"
            type="button"
          >

            <span>
              LYRICS
            </span>

          </button>

        </div>

      </div>


      {/* ==================================================
          SONG ACTION MENU
      ================================================== */}

      {actionMenuOpen && (

        <SongActionMenu

          song={
            currentSong
          }

          onClose={() =>
            setActionMenuOpen(
              false
            )
          }

          onAction={
            handleSongAction
          }

        />

      )}


      {/* ==================================================
          TOAST
      ================================================== */}

      {message && (

        <div className="song-action-toast">
          {message}
        </div>

      )}

    </div>

  );

}


export default NowPlaying;