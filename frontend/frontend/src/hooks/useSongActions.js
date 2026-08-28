import { useCallback } from "react";

import { usePlayer } from "../context/PlayerContext";


function useSongActions({
  onJam,
} = {}) {

  const {
    addToQueue,
    playNextSong,

    addToLibrary,
    removeFromLibrary,
    isInLibrary,

    addToFavorites,
    removeFromFavorites,
    isFavorite,

    playlists,
    createPlaylist,
    addToPlaylist,
  } = usePlayer();


  const performSongAction =
    useCallback(
      async (
        action,
        song
      ) => {

        if (!song) {
          return;
        }


        switch (action) {

          // ==================================================
          // QUEUE
          // ==================================================

          case "queue":

            addToQueue(song);

            return "Added to queue";


          // ==================================================
          // PLAY NEXT
          // ==================================================

          case "play-next":

            playNextSong(song);

            return "Playing next";


          // ==================================================
          // FAVORITE
          // ==================================================

          case "favorite":

            if (isFavorite(song)) {

              await removeFromFavorites(song);

              return "Removed from favorites";

            }

            await addToFavorites(song);

            return "Added to favorites";


          // ==================================================
          // LIBRARY
          // ==================================================

          case "library":

            if (isInLibrary(song)) {

              await removeFromLibrary(song);

              return "Removed from library";

            }

            await addToLibrary(song);

            return "Added to library";


          // ==================================================
          // PLAYLIST
          // ==================================================

          case "playlist": {

            const names =
              Object.keys(
                playlists ?? {}
              );


            // ------------------------------------------------
            // NO PLAYLISTS YET
            // ------------------------------------------------

            if (names.length === 0) {

              const name =
                window.prompt(
                  "Create a playlist"
                );


              if (!name?.trim()) {
                return null;
              }


              const cleanName =
                name.trim();


              try {

                await createPlaylist(
                  cleanName
                );


                await addToPlaylist(
                  cleanName,
                  song
                );


                return `Added to ${cleanName}`;

              } catch (error) {

                console.error(
                  "YOVI playlist creation failed:",
                  error
                );


                return (
                  error?.message ||
                  "Unable to create playlist"
                );

              }

            }


            // ------------------------------------------------
            // EXISTING PLAYLISTS
            // ------------------------------------------------

            const options =
              names
                .map(
                  (name, index) =>
                    `${index + 1}. ${name}`
                )
                .join("\n");


            const selected =
              window.prompt(
                `Add to playlist:\n\n${options}\n\nType an existing playlist name or enter a new name:`
              );


            if (!selected?.trim()) {
              return null;
            }


            const cleanName =
              selected.trim();


            // ------------------------------------------------
            // EXISTING PLAYLIST
            // ------------------------------------------------

            if (
              Object.prototype.hasOwnProperty.call(
                playlists ?? {},
                cleanName
              )
            ) {

              try {

                await addToPlaylist(
                  cleanName,
                  song
                );


                return `Added to ${cleanName}`;

              } catch (error) {

                console.error(
                  "YOVI add to playlist failed:",
                  error
                );


                return (
                  error?.message ||
                  "Unable to add song to playlist"
                );

              }

            }


            // ------------------------------------------------
            // NEW PLAYLIST
            // ------------------------------------------------

            try {

              await createPlaylist(
                cleanName
              );


              await addToPlaylist(
                cleanName,
                song
              );


              return `Added to ${cleanName}`;

            } catch (error) {

              console.error(
                "YOVI playlist creation failed:",
                error
              );


              return (
                error?.message ||
                "Unable to create playlist"
              );

            }

          }


          // ==================================================
          // SHARE
          // ==================================================

          case "share": {

            const shareUrl =
              window.location.href;


            const shareData = {

              title:
                song.title,

              text:
                `${song.title} — ${song.artist}`,

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

                return null;

              }


              if (
                navigator.clipboard
              ) {

                await navigator.clipboard.writeText(
                  shareUrl
                );

                return "Song link copied";

              }


              return "Sharing is not supported";

            } catch (error) {

              if (
                error?.name ===
                "AbortError"
              ) {

                return null;

              }


              return "Unable to share this song";

            }

          }


          // ==================================================
          // DOWNLOAD
          // ==================================================

          case "download":

            return (
              "Download is not available for this track"
            );


          // ==================================================
          // JAM
          // ==================================================

          case "jam":

            if (onJam) {

              onJam(song);

              return null;

            }


            window.dispatchEvent(
              new CustomEvent(
                "yovi:open-jam",
                {
                  detail: {
                    song,
                  },
                }
              )
            );


            return null;


          // ==================================================
          // DEFAULT
          // ==================================================

          default:

            return null;

        }

      },
      [
        addToQueue,
        playNextSong,

        addToLibrary,
        removeFromLibrary,
        isInLibrary,

        addToFavorites,
        removeFromFavorites,
        isFavorite,

        playlists,
        createPlaylist,
        addToPlaylist,

        onJam,
      ]
    );


  return {
    performSongAction,
  };

}


export default useSongActions;