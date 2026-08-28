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


const API_BASE_URL =
  "http://127.0.0.1:8000";

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


  const debounceRef =
    useRef(null);


  const requestIdRef =
    useRef(0);


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


    if (!trimmedQuery) {

      setResults([]);

      setLoading(false);

      setError("");

      return;

    }


    clearTimeout(
      debounceRef.current
    );


    debounceRef.current =
      setTimeout(
        async () => {

          const requestId =
            ++requestIdRef.current;


          try {

            setLoading(
              true
            );

            setError("");


            const response =
              await fetch(
                `${API_BASE_URL}/music/search?q=${encodeURIComponent(
                  trimmedQuery
                )}&limit=20`
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


            if (
              requestId !==
              requestIdRef.current
            ) {

              return;

            }


            setResults(
              Array.isArray(
                data.results
              )
                ? data.results
                : []
            );

          } catch (err) {

            if (
              requestId !==
              requestIdRef.current
            ) {

              return;

            }


            console.error(
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

            }

          }

        },
        300
      );


    return () => {

      clearTimeout(
        debounceRef.current
      );

    };

  }, [
    query,
  ]);


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
        !loading &&
        !error &&
        results.length === 0 && (

          <div className="search-status">

            No music found.

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
