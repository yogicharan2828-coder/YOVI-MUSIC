import {
  Ellipsis,
  Heart,
  Library,
  ListMusic,
  Music2,
  Plus,
  Play,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  usePlayer,
} from "../context/PlayerContext";

import useSongActions from "../hooks/useSongActions";

import SongActionMenu from "../components/player/SongActionMenu";


function Collections() {

  const {
    library,
    playlists,

    favorites,
    isFavorite,
    isInLibrary,

    removeFromLibrary,
    removeFromFavorites,

    playSong,
    createPlaylist,

  } = usePlayer();


  const {
    performSongAction,
  } = useSongActions();


  const [
    activeCollection,
    setActiveCollection,
  ] = useState("library");


  const [
    selectedPlaylist,
    setSelectedPlaylist,
  ] = useState(null);


  const [
    actionSong,
    setActionSong,
  ] = useState(null);




  // ==========================================================
  // CREATE PLAYLIST
  // ==========================================================

  const handleCreatePlaylist = () => {

    const name =
      window.prompt(
        "Enter playlist name"
      );


    if (!name?.trim()) {
      return;
    }


    createPlaylist(
      name.trim()
    );


    setActiveCollection(
      "playlists"
    );

  };


  // ==========================================================
  // PLAY
  // ==========================================================

  const handlePlaySong = (
    event,
    song,
    songs
  ) => {

    event.stopPropagation();

    playSong(
      song,
      songs
    );

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


    await performSongAction(
      action,
      actionSong
    );


    setActionSong(
      null
    );

  };


  // ==========================================================
  // PLAYLIST VIEW
  // ==========================================================

  if (
    activeCollection ===
      "playlists" &&
    selectedPlaylist
  ) {

    const songs =
      playlists[
        selectedPlaylist
      ] ?? [];


    return (

      <main className="collections-page">

        <div className="collections-container">


          <button
            className="collections-back"
            onClick={() =>
              setSelectedPlaylist(
                null
              )
            }
          >
            ← BACK TO PLAYLISTS
          </button>


          <div className="collections-hero">

            <div className="collections-playlist-icon">

              <ListMusic
                size={42}
              />

            </div>


            <div>

              <span className="collections-eyebrow">
                PLAYLIST
              </span>

              <h1>
                {selectedPlaylist}
              </h1>

              <p>
                {songs.length}{" "}
                {songs.length === 1
                  ? "song"
                  : "songs"}
              </p>

            </div>

          </div>


          <section className="collection-songs">

            {songs.length === 0 ? (

              <div className="collection-empty">

                <Music2
                  size={30}
                />

                <h3>
                  This playlist is empty
                </h3>

                <p>
                  Add songs from the
                  three-dot menu.
                </p>

              </div>

            ) : (

              songs.map(
                (song, index) => (

                  <div
                    key={
                      song.id ??
                      `${song.title}-${index}`
                    }
                    className="collection-song"
                    onClick={() =>
                      playSong(
                        song,
                        songs
                      )
                    }
                  >

                    <span className="collection-song-number">
                      {index + 1}
                    </span>


                    <img
                      src={song.image}
                      alt={song.title}
                    />


                    <span className="collection-song-info">

                      <strong>
                        {song.title}
                      </strong>

                      <span>
                        {song.artist}
                      </span>

                    </span>


                    <button
                      type="button"
                      className="collection-song-play"
                      onClick={(event) =>
                        handlePlaySong(
                          event,
                          song,
                          songs
                        )
                      }
                      aria-label={`Play ${song.title}`}
                    >

                      <Play
                        size={17}
                        fill="currentColor"
                      />

                    </button>


                    <button
                      type="button"
                      className="collection-more-button"
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
                        size={18}
                      />

                    </button>

                  </div>

                )
              )

            )}

          </section>

        </div>


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

      </main>

    );

  }


  // ==========================================================
  // CURRENT COLLECTION
  // ==========================================================

  let songs = [];

  let title = "";
  let description = "";
  let icon = null;


  if (
    activeCollection ===
    "favorites"
  ) {

    songs =
      favorites ?? [];

    title =
      "Liked Songs";

    description =
      "Songs you have saved as favorites.";

    icon =
      <Heart size={22} />;

  } else {

    songs =
      library ?? [];

    title =
      "Your Library";

    description =
      "Everything you have saved to your library.";

    icon =
      <Library size={22} />;

  }


  return (

    <main className="collections-page">

      <div className="collections-container">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="collections-header">

          <span className="collections-eyebrow">
            YOUR MUSIC
          </span>

          <h1>
            Collections
          </h1>

          <p>
            Your saved music, favorites,
            and playlists in one place.
          </p>

        </div>


        {/* ==================================================
            NAV
        ================================================== */}

        <div className="collections-tabs">

          <button
            className={
              activeCollection ===
              "favorites"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCollection(
                "favorites"
              )
            }
          >

            <Heart
              size={17}
            />

            <span>
              LIKED SONGS
            </span>

            <small>
              {favorites?.length ?? 0}
            </small>

          </button>


          <button
            className={
              activeCollection ===
              "library"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCollection(
                "library"
              )
            }
          >

            <Library
              size={17}
            />

            <span>
              LIBRARY
            </span>

            <small>
              {library?.length ?? 0}
            </small>

          </button>


          <button
            className={
              activeCollection ===
              "playlists"
                ? "active"
                : ""
            }
            onClick={() => {

              setActiveCollection(
                "playlists"
              );

              setSelectedPlaylist(
                null
              );

            }}
          >

            <ListMusic
              size={17}
            />

            <span>
              PLAYLISTS
            </span>

            <small>
              {
                Object.keys(
                  playlists ?? {}
                ).length
              }
            </small>

          </button>

        </div>


        {/* ==================================================
            PLAYLISTS
        ================================================== */}

        {activeCollection ===
        "playlists" ? (

          <section className="collections-section">

            <div className="collections-section-header">

              <div>

                <span className="collections-eyebrow">
                  YOUR PLAYLISTS
                </span>

                <h2>
                  Playlists
                </h2>

              </div>


              <button
                className="create-playlist-button"
                onClick={
                  handleCreatePlaylist
                }
              >

                <Plus
                  size={17}
                />

                CREATE PLAYLIST

              </button>

            </div>


            {Object.keys(
              playlists ?? {}
            ).length === 0 ? (

              <div className="collection-empty">

                <ListMusic
                  size={30}
                />

                <h3>
                  No playlists yet
                </h3>

                <p>
                  Create your first playlist
                  to start organizing music.
                </p>

                <button
                  onClick={
                    handleCreatePlaylist
                  }
                >
                  CREATE PLAYLIST
                </button>

              </div>

            ) : (

              <div className="playlist-grid">

                {Object.entries(
                  playlists
                ).map(
                  (
                    [
                      name,
                      playlistSongs,
                    ]
                  ) => (

                    <button
                      key={name}
                      className="playlist-card"
                      onClick={() =>
                        setSelectedPlaylist(
                          name
                        )
                      }
                    >

                      <div className="playlist-card-art">

                        {playlistSongs?.[0]
                          ?.image ? (

                          <img
                            src={
                              playlistSongs[0]
                                .image
                            }
                            alt=""
                          />

                        ) : (

                          <ListMusic
                            size={34}
                          />

                        )}

                      </div>


                      <strong>
                        {name}
                      </strong>


                      <span>
                        {playlistSongs?.length ?? 0}{" "}
                        songs
                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        ) : (

          <section className="collections-section">

            <div className="collections-section-header">

              <div>

                <span className="collections-eyebrow">
                  {activeCollection ===
                  "favorites"
                    ? "FAVORITES"
                    : "LIBRARY"}
                </span>

                <h2>
                  {title}
                </h2>

                <p>
                  {description}
                </p>

              </div>

            </div>


            {songs.length === 0 ? (

              <div className="collection-empty">

                {icon}

                <h3>
                  Nothing here yet
                </h3>

                <p>
                  {activeCollection ===
                  "favorites"
                    ? "Tap the heart on a song to save it here."
                    : "Use the three-dot menu to add songs to your library."}
                </p>

              </div>

            ) : (

              <div className="collection-songs">

                {songs.map(
                  (
                    song,
                    index
                  ) => (

                    <div
                      key={
                        song.id ??
                        `${song.title}-${index}`
                      }
                      className="collection-song"
                      onClick={() =>
                        playSong(
                          song,
                          songs
                        )
                      }
                    >

                      <span className="collection-song-number">
                        {index + 1}
                      </span>


                      <img
                        src={song.image}
                        alt={song.title}
                      />


                      <span className="collection-song-info">

                        <strong>
                          {song.title}
                        </strong>

                        <span>
                          {song.artist}
                        </span>

                      </span>


                      <button
                        type="button"
                        className="collection-song-play"
                        onClick={(event) =>
                          handlePlaySong(
                            event,
                            song,
                            songs
                          )
                        }
                        aria-label={`Play ${song.title}`}
                      >

                        <Play
                          size={17}
                          fill="currentColor"
                        />

                      </button>


                      <button
                        type="button"
                        className="collection-more-button"
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
                          size={18}
                        />

                      </button>


                      {activeCollection ===
                        "favorites" && (

                        <button
                          type="button"
                          className="collection-remove"
                          onClick={(event) => {

                            event.stopPropagation();

                            removeFromFavorites(
                              song
                            );

                          }}
                          title="Remove from liked songs"
                          aria-label="Remove from liked songs"
                        >

                          <Heart
                            size={17}
                            fill="currentColor"
                          />

                        </button>

                      )}


                      {activeCollection ===
                        "library" && (

                        <button
                          type="button"
                          className="collection-remove"
                          onClick={(event) => {

                            event.stopPropagation();

                            removeFromLibrary(
                              song
                            );

                          }}
                          title="Remove from library"
                          aria-label="Remove from library"
                        >

                          <Trash2
                            size={17}
                          />

                        </button>

                      )}

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        )}

      </div>


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

    </main>

  );

}


export default Collections;
