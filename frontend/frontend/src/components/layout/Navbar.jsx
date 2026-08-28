import {
  Search,
  UserRound,
  X,
  Play,
  Ellipsis,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import JamPanel from "../jam/JamPanel";

import {
  usePlayer,
} from "../../context/PlayerContext";

import {
  useAuth,
} from "../../context/AuthContext";

import useSongActions from "../../hooks/useSongActions";

import SongActionMenu from "../player/SongActionMenu";


import API_BASE_URL from "../../config/api";


// ============================================================
// CHARTUNE JAM MARK
// ============================================================

function ChartuneJamMark() {

  return (
    <span
      className="chartune-jam-mark"
      aria-hidden="true"
    >

      <svg
        viewBox="0 0 32 32"
        width="21"
        height="21"
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


// ============================================================
// NAVBAR
// ============================================================

function Navbar({
  jamOpen,
  onJamOpen,
  onJamClose,
}) {

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);


  const [
    query,
    setQuery,
  ] = useState("");


  const [
    searchResults,
    setSearchResults,
  ] = useState([]);


  const [
    searchLoading,
    setSearchLoading,
  ] = useState(false);


  const [
    searchError,
    setSearchError,
  ] = useState("");


  const [
    actionSong,
    setActionSong,
  ] = useState(null);


  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);


  const navigate =
    useNavigate();


  const location =
    useLocation();


  const searchRef =
    useRef(null);


  const profileRef =
    useRef(null);


  const debounceRef =
    useRef(null);


  const abortRef =
    useRef(null);


  const searchCacheRef =
    useRef(
      new Map()
    );


  const {
    playSong,
    isFavorite,
    isInLibrary,
  } = usePlayer();


  const {
    user,
    loading: authLoading,
    isAuthenticated,
    logout,
  } = useAuth();


  const {
    performSongAction,
  } = useSongActions();


  // ==========================================================
  // USER INITIAL
  // ==========================================================

  const userInitial =
    (
      user?.username ||
      "Y"
    )
      .trim()
      .charAt(0)
      .toUpperCase() || "Y";


  // ==========================================================
  // LIVE SEARCH
  // ==========================================================

  useEffect(() => {

    const trimmedQuery =
      query.trim();


    if (
      !searchOpen ||
      trimmedQuery.length < 2
    ) {

      if (
        abortRef.current
      ) {

        abortRef.current.abort();

        abortRef.current =
          null;

      }


      clearTimeout(
        debounceRef.current
      );


      setSearchLoading(false);

      setSearchError("");


      if (
        trimmedQuery.length === 0
      ) {

        setSearchResults([]);

      }

      return;

    }


    const cacheKey =
      trimmedQuery.toLowerCase();


    const cached =
      searchCacheRef.current.get(
        cacheKey
      );


    if (
      cached
    ) {

      setSearchResults(
        cached
      );

      setSearchLoading(false);

      setSearchError("");

      return;

    }


    if (
      abortRef.current
    ) {

      abortRef.current.abort();

    }


    clearTimeout(
      debounceRef.current
    );


    setSearchLoading(true);

    setSearchError("");


    debounceRef.current =
      setTimeout(
        async () => {

          const controller =
            new AbortController();


          abortRef.current =
            controller;


          try {

            const response =
              await fetch(
                `${API_BASE_URL}/music/search?q=${encodeURIComponent(
                  trimmedQuery
                )}&limit=6`,
                {
                  signal:
                    controller.signal,
                }
              );


            if (
              !response.ok
            ) {

              throw new Error(
                `Search failed: ${response.status}`
              );

            }


            const data =
              await response.json();


            const results =
              Array.isArray(
                data.results
              )
                ? data.results
                : [];


            searchCacheRef.current.set(
              cacheKey,
              results
            );


            if (
              searchCacheRef.current.size >
              30
            ) {

              const oldestKey =
                searchCacheRef.current
                  .keys()
                  .next()
                  .value;


              if (
                oldestKey
              ) {

                searchCacheRef.current.delete(
                  oldestKey
                );

              }

            }


            setSearchResults(
              results
            );


            setSearchError("");

          } catch (error) {

            if (
              error?.name ===
              "AbortError"
            ) {

              return;

            }


            console.error(
              "YOVI NAV SEARCH:",
              error
            );


            setSearchError(
              "Unable to search right now."
            );

          } finally {

            if (
              abortRef.current ===
              controller
            ) {

              setSearchLoading(false);

              abortRef.current =
                null;

            }

          }

        },
        250
      );


    return () => {

      clearTimeout(
        debounceRef.current
      );

    };

  }, [
    query,
    searchOpen,
  ]);


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {

    return () => {

      clearTimeout(
        debounceRef.current
      );


      if (
        abortRef.current
      ) {

        abortRef.current.abort();

      }

    };

  }, []);


  // ==========================================================
  // OUTSIDE CLICK
  // ==========================================================

  useEffect(() => {

    const handlePointerDown =
      (event) => {

        if (
          event.target.closest(
            ".song-action-overlay"
          )
        ) {

          return;

        }


        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target
          )
        ) {

          setSearchOpen(
            false
          );

          setActionSong(
            null
          );

        }


        if (
          profileRef.current &&
          !profileRef.current.contains(
            event.target
          )
        ) {

          setProfileOpen(
            false
          );

        }

      };


    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );


    return () => {

      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

    };

  }, []);


  // ==========================================================
  // CLOSE PROFILE ON ROUTE CHANGE
  // ==========================================================

  useEffect(() => {

    setProfileOpen(
      false
    );

  }, [
    location.pathname,
  ]);


  // ==========================================================
  // SEARCH SUBMIT
  // ==========================================================

  const handleSearch = (
    event
  ) => {

    event.preventDefault();


    const trimmedQuery =
      query.trim();


    if (!trimmedQuery) {
      return;
    }


    navigate(
      `/search?q=${encodeURIComponent(
        trimmedQuery
      )}`
    );


    setSearchOpen(false);

    setActionSong(null);

  };


  // ==========================================================
  // PLAY SEARCH RESULT
  // ==========================================================

  const handleResultPlay = (
    event,
    song
  ) => {

    event.preventDefault();

    event.stopPropagation();


    playSong(
      song,
      searchResults
    );


    setSearchOpen(false);

    setActionSong(null);

  };


  // ==========================================================
  // SEARCH RESULT MENU
  // ==========================================================

  const handleResultMenu = (
    event,
    song
  ) => {

    event.preventDefault();

    event.stopPropagation();


    setActionSong(
      song
    );

  };


  // ==========================================================
  // SONG ACTION
  // ==========================================================

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
  // SEARCH OPEN / CLOSE
  // ==========================================================

  const openSearch = () => {

    setSearchOpen(true);

  };


  const closeSearch = () => {

    if (
      abortRef.current
    ) {

      abortRef.current.abort();

      abortRef.current =
        null;

    }


    clearTimeout(
      debounceRef.current
    );


    setSearchOpen(false);

    setQuery("");

    setSearchResults([]);

    setSearchLoading(false);

    setSearchError("");

    setActionSong(null);

  };


  // ==========================================================
  // PROFILE
  // ==========================================================

  const handleProfileClick = () => {

    setProfileOpen(
      (previous) =>
        !previous
    );

  };


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = () => {

    setProfileOpen(
      false
    );

    navigate(
      "/login"
    );

  };


  // ==========================================================
  // REGISTER
  // ==========================================================

  const handleRegister = () => {

    setProfileOpen(
      false
    );

    navigate(
      "/register"
    );

  };


  // ==========================================================
  // PROFILE
  // ==========================================================

  const handleProfile = () => {

    setProfileOpen(
      false
    );

    navigate(
      "/profile"
    );

  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    /*
     * AuthContext clears the user immediately.
     */

    logout();


    setProfileOpen(
      false
    );


    navigate(
      "/"
    );

  };


  // ==========================================================
  // HOME
  // ==========================================================

  const isHome =
    location.pathname === "/";


  const showDropdown =
    searchOpen &&
    query.trim().length >= 2;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <header className="yovi-navbar">


      {/* =====================================================
          LOGO
      ===================================================== */}

      <Link
        to="/"
        className="yovi-logo"
      >

        <span className="yovi-logo-mark">
          Y
        </span>

        <span className="yovi-logo-text">
          YOVI
        </span>

      </Link>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="yovi-nav">

        <Link
          to="/"
          className={
            isHome
              ? "active"
              : ""
          }
        >
          EXPERIENCE
        </Link>


        <Link
          to="/explore"
        >
          EXPLORE
        </Link>


        <Link
          to="/collections"
        >
          COLLECTIONS
        </Link>

      </nav>


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="yovi-actions">


        {/* ==================================================
            SEARCH
        ================================================== */}

        {searchOpen ? (

          <div
            ref={searchRef}
            className="nav-search-wrapper"
          >

            <form
              className="nav-search-form"
              onSubmit={
                handleSearch
              }
            >

              <Search
                size={17}
                strokeWidth={1.5}
              />


              <input
                autoFocus
                type="text"
                placeholder="Search songs, artists..."
                value={query}
                onChange={(
                  event
                ) =>
                  setQuery(
                    event.target.value
                  )
                }
              />


              {query && (

                <button
                  type="button"
                  className="nav-search-clear"
                  onClick={() => {

                    setQuery("");

                    setSearchResults([]);

                    setSearchError("");

                  }}
                  aria-label="Clear search"
                >

                  <X
                    size={14}
                  />

                </button>

              )}


              <button
                type="button"
                className="nav-search-close"
                onClick={
                  closeSearch
                }
                aria-label="Close search"
              >

                <X
                  size={16}
                />

              </button>

            </form>


            {showDropdown && (

              <div
                className="nav-search-dropdown"
              >

                <div className="nav-search-dropdown-header">

                  <span>
                    SEARCH RESULTS
                  </span>


                  {searchLoading && (

                    <span>
                      SEARCHING...
                    </span>

                  )}

                </div>


                {searchError && (

                  <div className="nav-search-status nav-search-error">
                    {searchError}
                  </div>

                )}


                {!searchError &&
                  !searchLoading &&
                  searchResults.length === 0 && (

                    <div className="nav-search-status">
                      No music found.
                    </div>

                  )}


                {searchResults.map(
                  (song, index) => (

                    <div
                      key={`${song.provider}-${song.id}-${index}`}
                      className="nav-search-result"
                      onClick={(
                        event
                      ) =>
                        handleResultPlay(
                          event,
                          song
                        )
                      }
                    >

                      <img
                        src={
                          song.image
                        }
                        alt=""
                        loading="lazy"
                      />


                      <span className="nav-search-result-info">

                        <strong>
                          {song.title}
                        </strong>

                        <span>
                          {song.artist}
                        </span>

                      </span>


                      <button
                        type="button"
                        className="nav-search-result-play"
                        onClick={(
                          event
                        ) =>
                          handleResultPlay(
                            event,
                            song
                          )
                        }
                        aria-label={`Play ${song.title}`}
                      >

                        <Play
                          size={12}
                          fill="currentColor"
                        />

                      </button>


                      <button
                        type="button"
                        className="nav-search-result-more"
                        onClick={(
                          event
                        ) =>
                          handleResultMenu(
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

                  )
                )}


                {!searchLoading &&
                  searchResults.length > 0 && (

                    <div className="nav-search-footer">
                      Click a song to play • ⋮ for more
                    </div>

                  )}

              </div>

            )}


            {/* =================================================
                SEARCH RESULT ACTION MENU
            ================================================= */}

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

        ) : (

          <button
            className="nav-icon"
            onClick={
              openSearch
            }
            aria-label="Search"
          >

            <Search
              size={19}
              strokeWidth={1.5}
            />

          </button>

        )}


        {/* ==================================================
            CHARTUNE JAM
        ================================================== */}

        <button
          className="nav-icon chartune-jam-button"
          onClick={
            onJamOpen
          }
          aria-label="Chartune Jam"
          title="Chartune Jam"
        >

          <ChartuneJamMark />

        </button>


        {/* ==================================================
            PROFILE
        ================================================== */}

        <div
          ref={profileRef}
          className="profile-wrapper"
        >

          <button
            type="button"
            className={
              profileOpen
                ? "profile-button active"
                : "profile-button"
            }
            onClick={
              handleProfileClick
            }
            aria-label="Profile"
            aria-expanded={
              profileOpen
            }
          >

            {authLoading ? (

              <UserRound
                size={18}
                strokeWidth={1.5}
              />

            ) : isAuthenticated ? (

              <span className="profile-initial">

                {userInitial}

              </span>

            ) : (

              <UserRound
                size={18}
                strokeWidth={1.5}
              />

            )}

          </button>


          {/* =================================================
              PROFILE DROPDOWN
          ================================================= */}

          {profileOpen && (

            <div
              className="profile-dropdown"
            >

              {authLoading ? (

                <div className="profile-dropdown-loading">

                  LOADING...

                </div>

              ) : !isAuthenticated ? (

                <>
                  {/* =========================================
                      GUEST
                  ========================================= */}

                  <div className="profile-dropdown-header">

                    <div className="profile-dropdown-icon">

                      <UserRound
                        size={20}
                        strokeWidth={1.4}
                      />

                    </div>


                    <div>

                      <strong>
                        Welcome to YOVI
                      </strong>

                      <span>
                        Sign in to personalize your experience.
                      </span>

                    </div>

                  </div>


                  <div className="profile-dropdown-divider" />


                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={
                      handleLogin
                    }
                  >

                    <LogIn
                      size={17}
                      strokeWidth={1.5}
                    />

                    <span>
                      SIGN IN
                    </span>

                  </button>


                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={
                      handleRegister
                    }
                  >

                    <UserPlus
                      size={17}
                      strokeWidth={1.5}
                    />

                    <span>
                      CREATE ACCOUNT
                    </span>

                  </button>

                </>

              ) : (

                <>
                  {/* =========================================
                      AUTHENTICATED USER
                  ========================================= */}

                  <div className="profile-dropdown-header">

                    <div className="profile-dropdown-avatar">

                      <span>
                        {userInitial}
                      </span>

                    </div>


                    <div>

                      <strong>
                        {user?.display_name ||
                          user?.username ||
                          "YOVI User"}
                      </strong>

                      <span>
                        @{user?.username}
                      </span>

                    </div>

                  </div>


                  <div className="profile-dropdown-divider" />


                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={
                      handleProfile
                    }
                  >

                    <UserRound
                      size={17}
                      strokeWidth={1.5}
                    />

                    <span>
                      PROFILE
                    </span>

                  </button>


                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={
                      handleProfile
                    }
                  >

                    <Settings
                      size={17}
                      strokeWidth={1.5}
                    />

                    <span>
                      ACCOUNT SETTINGS
                    </span>

                  </button>


                  <div className="profile-dropdown-divider" />


                  <button
                    type="button"
                    className="profile-dropdown-item danger"
                    onClick={
                      handleLogout
                    }
                  >

                    <LogOut
                      size={17}
                      strokeWidth={1.5}
                    />

                    <span>
                      LOG OUT
                    </span>

                  </button>

                </>

              )}

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          JAM PANEL
      ===================================================== */}

      {jamOpen && (

        <JamPanel
          onClose={
            onJamClose
          }
        />

      )}

    </header>

  );

}


export default Navbar;