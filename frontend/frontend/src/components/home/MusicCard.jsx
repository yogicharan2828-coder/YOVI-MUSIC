import {
  Ellipsis,
  Play,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePlayer,
} from "../../context/PlayerContext";

import useSongActions from "../../hooks/useSongActions";

import SongActionMenu from "../player/SongActionMenu";


function MusicCard({
  song,
  queue = [],
}) {

  const {
    playSong,
    primeSong,
    isSongReady,

    isFavorite,
    isInLibrary,
  } = usePlayer();


  const [
    actionMenuOpen,
    setActionMenuOpen,
  ] = useState(false);


  const [
    actionMessage,
    setActionMessage,
  ] = useState("");


  const {
    performSongAction,
  } = useSongActions();


  useEffect(() => {

    primeSong(
      song
    );

  }, [
    song,
    primeSong,
  ]);


  const ready =
    isSongReady(
      song
    );


  // ==========================================================
  // PLAY
  // ==========================================================

  const handlePlay = async (
    event
  ) => {

    event.stopPropagation();

    /*
     * Do NOT block the click when the
     * YouTube ID is still being prepared.
     *
     * PlayerContext already knows how to
     * resolve the song asynchronously.
     */
    await playSong(
      song,
      queue
    );

  };


  // ==========================================================
  // CARD CLICK
  // ==========================================================

  const handleCardClick = () => {

    playSong(
      song,
      queue
    );

  };


  // ==========================================================
  // ACTION MENU
  // ==========================================================

  const handleMenuClick = (
    event
  ) => {

    event.stopPropagation();

    setActionMenuOpen(
      true
    );

  };


  const handleAction = async (
    action
  ) => {

    const message =
      await performSongAction(
        action,
        song
      );


    setActionMenuOpen(
      false
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


  return (

    <article
      className="music-card"
      onClick={
        handleCardClick
      }
    >

      <div className="music-card-artwork">

        <img
          src={
            song.image
          }
          alt={
            song.title
          }
          loading="lazy"
        />


        {/* ==================================================
            THREE DOTS
        ================================================== */}

        <button
          type="button"
          className="music-card-menu-button"
          onClick={
            handleMenuClick
          }
          aria-label={`More options for ${song.title}`}
          title="More options"
        >

          <Ellipsis
            size={18}
          />

        </button>


        {/* ==================================================
            PLAY
        ================================================== */}

        <button
          type="button"
          className={
            ready
              ? "music-card-play"
              : "music-card-play loading"
          }
          onClick={
            handlePlay
          }
          aria-label={
            ready
              ? `Play ${song.title}`
              : `Prepare ${song.title}`
          }
          title={
            ready
              ? `Play ${song.title}`
              : "Preparing playback"
          }
        >

          <Play
            size={16}
            fill="currentColor"
          />

        </button>

      </div>


      <div className="music-card-info">

        <h3>
          {song.title}
        </h3>


        <p>
          {song.artist}
        </p>

      </div>


      {actionMessage && (

        <div
          className="music-card-action-toast"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {actionMessage}
        </div>

      )}


      {actionMenuOpen && (

        <SongActionMenu

          song={
            song
          }

          isFavorite={
            isFavorite(song)
          }

          isInLibrary={
            isInLibrary(song)
          }

          onClose={() =>
            setActionMenuOpen(
              false
            )
          }

          onAction={
            handleAction
          }

        />

      )}

    </article>

  );

}


export default MusicCard;
