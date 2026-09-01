import {
  Ellipsis,
  Play,
  Search as SearchIcon,
  Clock3,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  usePlayer,
} from "../context/PlayerContext";

import useSongActions from "../hooks/useSongActions";

import SongActionMenu from "../components/player/SongActionMenu";

import API_BASE_URL from "../config/api";


const SEARCH_HISTORY_KEY =
  "yovi_search_history";

const MAX_HISTORY =
  8;


// ============================================================
// HISTORY
// ============================================================

function loadSearchHistory() {

  try {

    const saved =
      localStorage.getItem(
        SEARCH_HISTORY_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {

    return [];

  }

}


function saveSearchHistory(
  history
) {

  try {

    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(
        history
      )
    );

  } catch {

    // Ignore storage failures.

  }

}


// ============================================================
// SEARCH PAGE
// ============================================================

function Search() {

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  const query =
    searchParams.get("q") || "";


  const [
    results,
    setResults,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    history,
    setHistory,
  ] = useState(
    loadSearchHistory
  );


  const [
    actionSong,
    setActionSong,
  ] = useState(null);


  // ----------------------------------------------------------
  // SEARCH CONTROL REFS
  // ----------------------------------------------------------

  const debounceRef =
    useRef(null);


  const requestIdRef =
    useRef(0);


  const abortControllerRef =
    useRef(null);


  const {
    playSong,
    isFavorite,
    isInLibrary,
  } = usePlayer();


  const {
    performSongAction,
  } = useSongActions();


  // ==========================================================
  // HISTORY
  // ==========================================================

  const addToHistory = (
    value
  ) => {

    const trimmed =
      value.trim();

    if (!trimmed) {
      return;
    }


    const updated = [

      trimmed,

      ...history.filter(
        (item) =>
          item.toLowerCase() !==
          trimmed.toLowerCase()
      ),

    ].slice(
      0,
      MAX_HISTORY
    );


    setHistory(
      updated
    );


    saveSearchHistory(
      updated
    );

  };


  const removeHistory = (
    event,
    item
  ) => {

    event.stopPropagation();


    const updated =
      history.filter(
        (entry) =>
          entry !== item
      );


    setHistory(
      updated
    );


    saveSearchHistory(
      updated
    );

  };


  // ==========================================================
  // SEARCH
  // ==========================================================

  useEffect(() => {

    const trimmedQuery =
      query.trim();


    // --------------------------------------------------------
    // EMPTY QUERY
    // --------------------------------------------------------

    if (!trimmedQuery) {

      requestIdRef.current += 1;


      if (
        abortControllerRef.current
      ) {

        abortControllerRef.current.abort();

        abortControllerRef.current =
          null;

      }


      clearTimeout(
        debounceRef.current
      );


      setResults([]);

      setLoading(false);

      setError("");

      return;

    }


    // --------------------------------------------------------
    // DON'T SEARCH FOR VERY SHORT QUERIES
    // --------------------------------------------------------

    if (
      trimmedQuery.length < 3
    ) {

      requestIdRef.current += 1;


      if (
        abortControllerRef.current
      ) {

        abortControllerRef.current.abort();

        abortControllerRef.current =
          null;

      }


      clearTimeout(
        debounceRef.current
      );


      setResults([]);

      setLoading(false);

      setError("");

      return;

    }


    // --------------------------------------------------------
    // CANCEL PREVIOUS DEBOUNCE
    // --------------------------------------------------------

    clearTimeout(
      debounceRef.current
    );


    // --------------------------------------------------------
    // CANCEL PREVIOUS REQUEST
    // --------------------------------------------------------

    if (
      abortControllerRef.current
    ) {

      abortControllerRef.current.abort();

      abortControllerRef.current =
        null;

    }


    // --------------------------------------------------------
    // DEBOUNCE
    // --------------------------------------------------------

    debounceRef.current =
      setTimeout(
        async () => {

          const requestId =
            ++requestIdRef.current;


          const controller =
            new AbortController();


          abortControllerRef.current =
            controller;


          try {

            setLoading(
              true
            );

            setError("");


            // ------------------------------------------------
            // JIOSAAVN SEARCH
            // ------------------------------------------------

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


            // ------------------------------------------------
            // IGNORE STALE REQUESTS
            // ------------------------------------------------

            if (
              requestId !==
              requestIdRef.current
            ) {

              return;

            }


            const nextResults =
              Array.isArray(
                data.results
              )
                ? data.results
                : [];


            setResults(
              nextResults
            );


          } catch (err) {

            // ------------------------------------------------
            // ABORTED REQUESTS ARE NORMAL
            // ------------------------------------------------

            if (
              err?.name ===
              "AbortError"
            ) {

              return;

            }


            if (
              requestId !==
              requestIdRef.current
            ) {

              return;

            }


            console.error(
              "[YOVI SEARCH]",
              err
            );


            setError(
              "Unable to search music right now."
            );


            setResults([]);

          } finally {

            if (
              requestId ===
              requestIdRef.current
            ) {

              setLoading(
                false
              );


              if (
                abortControllerRef.current ===
                controller
              ) {

                abortControllerRef.current =
                  null;

              }

            }

          }

        },
        300
      );


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      clearTimeout(
        debounceRef.current
      );

    };

  }, [
    query,
  ]);


  // ==========================================================
  // COMPONENT UNMOUNT CLEANUP
  // ==========================================================

  useEffect(() => {

    return () => {

      clearTimeout(
        debounceRef.current
      );


      if (
        abortControllerRef.current
      ) {

        abortControllerRef.current.abort();

      }

    };

  }, []);


  // ==========================================================
  // PLAY
  // ==========================================================

  const handlePlay = (
    song
  ) => {

    addToHistory(
      query
    );


    playSong(
      song,
      results
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
  // HISTORY SEARCH
  // ==========================================================

  const selectHistory = (
    item
  ) => {

    addToHistory(
      item
    );


    setSearchParams({
      q: item,
    });

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="search-page">

      <div className="search-page-header">

        <span className="search-eyebrow">
          YOVI SEARCH
        </span>


        <h1>
          Search results
        </h1>


        <p>

          {query.trim()
            ? (
              <>
                Results for{" "}

                <strong>
                  "{query}"
                </strong>
              </>
            )
            : (
              "Search songs, artists and albums."
            )}

        </p>

      </div>


      {/* ====================================================
          HISTORY
      ==================================================== */}

      {!query.trim() && (

        <section className="search-history-page">

          <div className="search-history-page-header">

            <span>
              RECENT SEARCHES
            </span>

          </div>


          {history.length === 0 ? (

            <div className="search-status">

              <Clock3
                size={16}
              />

              Your recent searches will appear here.

            </div>

          ) : (

            <div className="search-history-list">

              {history.map(
                (item) => (

                  <div
                    className="search-history-page-item"
                    key={item}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        selectHistory(
                          item
                        )
                      }
                    >

                      <Clock3
                        size={16}
                      />

                      <span>
                        {item}
                      </span>

                    </button>


                    <button
                      type="button"
                      className="search-history-page-remove"
                      aria-label={`Remove ${item}`}
                      onClick={(
                        event
                      ) =>
                        removeHistory(
                          event,
                          item
                        )
                      }
                    >

                      <X
                        size={15}
                      />

                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      )}


      {/* ====================================================
          STATUS
      ==================================================== */}

      {query.trim() &&
        query.trim().length >= 3 &&
        loading && (

          <div className="search-status">

            <SearchIcon
              size={16}
            />

            Searching YOVI...

          </div>

        )}


      {query.trim() &&
        error && (

          <div className="search-status search-error">

            {error}

          </div>

        )}


      {query.trim() &&
        query.trim().length >= 3 &&
        !loading &&
        !error &&
        results.length === 0 && (

          <div className="search-status">

            No music found.

          </div>

        )}


      {query.trim() &&
        query.trim().length > 0 &&
        query.trim().length < 3 &&
        !loading && (

          <div className="search-status">

            Type at least 3 characters to search.

          </div>

        )}


      {/* ====================================================
          RESULTS
      ==================================================== */}

      {query.trim() &&
        results.length > 0 && (

          <section className="search-results">

            {results.map(
              (song, index) => (

                <article
                  className="search-result"
                  key={`${song.provider}-${song.id}-${index}`}
                  onClick={() =>
                    handlePlay(
                      song
                    )
                  }
                >

                  <img
                    src={
                      song.image
                    }
                    alt={
                      song.title
                    }
                    loading="lazy"
                  />


                  <div className="search-result-info">

                    <h2>
                      {song.title}
                    </h2>


                    <p>
                      {song.artist}
                    </p>


                    {song.album && (

                      <span className="search-result-album">

                        {song.album}

                      </span>

                    )}

                  </div>


                  <button
                    type="button"
                    className="search-play-button"
                    onClick={(
                      event
                    ) => {

                      event.stopPropagation();


                      handlePlay(
                        song
                      );

                    }}
                    aria-label={`Play ${song.title}`}
                  >

                    <Play
                      size={16}
                      fill="currentColor"
                    />

                  </button>


                  <button
                    type="button"
                    className="search-more-button"
                    onClick={(
                      event
                    ) =>
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

                </article>

              )
            )}

          </section>

        )}


      {/* ====================================================
          ACTION MENU
      ==================================================== */}

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


export default Search;