import { createPortal } from "react-dom";

import {
  Download,
  Heart,
  Headphones,
  Library,
  ListMusic,
  Play,
  Share2,
} from "lucide-react";


function SongActionMenu({
  song,
  onClose,
  onAction,

  isFavorite = false,
  isInLibrary = false,
}) {

  if (!song) {
    return null;
  }


  const handleAction = (
    action
  ) => {

    onAction(
      action
    );

  };


  return createPortal(

    <div
      className="song-action-overlay"

      onMouseDown={(event) => {

        /*
         * The menu can be opened from:
         *
         * Home
         * Search
         * Collections
         * Queue
         * Now Playing
         *
         * Because this menu is rendered through
         * a portal, it is no longer physically
         * inside the song card.
         */

        event.stopPropagation();


        /*
         * Clicking the dark background closes
         * the menu.
         */

        if (
          event.target ===
          event.currentTarget
        ) {

          onClose();

        }

      }}

      onClick={(event) => {

        /*
         * Critical:
         *
         * Never allow an action click to reach
         * the underlying song/card.
         *
         * Therefore:
         *
         * Add Queue
         * Play Next
         * Favorite
         * Playlist
         * Jam
         * Share
         * Download
         *
         * can NEVER accidentally play the song.
         */

        event.stopPropagation();

      }}
    >

      <div
        className="song-action-menu"

        onMouseDown={(event) =>
          event.stopPropagation()
        }

        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div
          className="song-action-handle"
        />


        {/* ==================================================
            SONG HEADER
        ================================================== */}

        <div className="song-action-song">

          <img
            src={
              song.image
            }
            alt={
              song.title
            }
          />

          <div>

            <strong>
              {song.title}
            </strong>

            <span>
              {song.artist}
            </span>

          </div>

        </div>


        {/* ==================================================
            FAVORITE
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "favorite"
            )
          }
        >

          <Heart
            size={19}
            fill={
              isFavorite
                ? "currentColor"
                : "none"
            }
          />

          <span>
            {
              isFavorite
                ? "Remove from Favorites"
                : "Add to Favorites"
            }
          </span>

        </button>


        {/* ==================================================
            LIBRARY
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "library"
            )
          }
        >

          <Library
            size={19}
          />

          <span>
            {
              isInLibrary
                ? "Remove from Library"
                : "Add to Library"
            }
          </span>

        </button>


        {/* ==================================================
            PLAYLIST
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "playlist"
            )
          }
        >

          <ListMusic
            size={19}
          />

          <span>
            Add to Playlist
          </span>

        </button>


        {/* ==================================================
            QUEUE
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "queue"
            )
          }
        >

          <ListMusic
            size={19}
          />

          <span>
            Add to Queue
          </span>

        </button>


        {/* ==================================================
            PLAY NEXT
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "play-next"
            )
          }
        >

          <Play
            size={19}
          />

          <span>
            Play Next
          </span>

        </button>


        {/* ==================================================
            JAM
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "jam"
            )
          }
        >

          <Headphones
            size={19}
          />

          <span>
            Start a Jam
          </span>

        </button>


        {/* ==================================================
            DOWNLOAD
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "download"
            )
          }
        >

          <Download
            size={19}
          />

          <span>
            Download
          </span>

        </button>


        {/* ==================================================
            SHARE
        ================================================== */}

        <button
          type="button"

          onClick={() =>
            handleAction(
              "share"
            )
          }
        >

          <Share2
            size={19}
          />

          <span>
            Share
          </span>

        </button>

      </div>

    </div>,

    document.body

  );

}


export default SongActionMenu;