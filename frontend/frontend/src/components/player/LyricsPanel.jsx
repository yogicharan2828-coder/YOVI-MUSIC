import {
  LoaderCircle,
  Music2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePlayer } from "../../context/PlayerContext";

const API_BASE_URL =
  "http://127.0.0.1:8000";


function parseSyncedLyrics(syncedLyrics) {

  if (!syncedLyrics) {
    return [];
  }

  return syncedLyrics
    .split("\n")
    .map((line) => {

      const match = line.match(
        /^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/
      );

      if (!match) {
        return null;
      }

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);

      return {
        time:
          minutes * 60 +
          seconds,

        text:
          match[3].trim(),
      };

    })
    .filter(Boolean);

}


function parsePlainLyrics(plainLyrics) {

  if (!plainLyrics) {
    return [];
  }

  return plainLyrics
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({
      time: null,
      text,
    }));

}


function LyricsPanel({ onClose }) {

  const {
    currentSong,
    currentTime,
  } = usePlayer();


  const [lyrics, setLyrics] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);


  const activeLineRef =
    useRef(null);


  // ==========================================================
  // FETCH LYRICS
  // ==========================================================

  useEffect(() => {

    if (!currentSong) {
      return;
    }


    let cancelled = false;


    const fetchLyrics = async () => {

      try {

        setLoading(true);
        setError(null);
        setLyrics(null);


        const params =
          new URLSearchParams();


        params.set(
          "title",
          currentSong.title
        );


        params.set(
          "artist",
          currentSong.artist
        );


        if (currentSong.album) {

          params.set(
            "album",
            currentSong.album
          );

        }


        if (currentSong.duration) {

          const durationInSeconds =
            currentSong.duration > 10000
              ? currentSong.duration / 1000
              : currentSong.duration;


          params.set(
            "duration",
            durationInSeconds
          );

        }


        const url =
          `${API_BASE_URL}/lyrics/search?${params.toString()}`;


        console.log(
          "YOVI lyrics request:",
          url
        );


        const response =
          await fetch(url);


        if (!response.ok) {

          throw new Error(
            `Lyrics request failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        console.log(
          "YOVI lyrics response:",
          data
        );


        if (!cancelled) {
          setLyrics(data);
        }


      } catch (err) {

        console.error(
          "Lyrics lookup failed:",
          err
        );


        if (!cancelled) {
          setError(
            err.message ||
            "Lyrics lookup failed"
          );
        }


      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    };


    fetchLyrics();


    return () => {
      cancelled = true;
    };


  }, [
    currentSong?.id,
    currentSong?.title,
    currentSong?.artist,
    currentSong?.album,
    currentSong?.duration,
  ]);


  // ==========================================================
  // PARSE LYRICS
  // ==========================================================

  const lyricLines =
    useMemo(() => {

      if (!lyrics?.found) {
        return [];
      }


      if (lyrics.syncedLyrics) {

        const synced =
          parseSyncedLyrics(
            lyrics.syncedLyrics
          );


        if (synced.length > 0) {
          return synced;
        }

      }


      return parsePlainLyrics(
        lyrics.plainLyrics
      );

    }, [lyrics]);


  // ==========================================================
  // ACTIVE LINE
  // ==========================================================

  const activeIndex =
    useMemo(() => {

      if (
        !lyrics?.syncedLyrics ||
        lyricLines.length === 0
      ) {

        return -1;

      }


      let active = -1;


      for (
        let i = 0;
        i < lyricLines.length;
        i++
      ) {

        if (
          currentTime >=
          lyricLines[i].time
        ) {

          active = i;

        } else {

          break;

        }

      }


      return active;

    }, [
      currentTime,
      lyricLines,
      lyrics,
    ]);


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

  if (
    activeIndex < 0 ||
    !activeLineRef.current
  ) {
    return;
  }

  activeLineRef.current.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

}, [activeIndex]);


  // ==========================================================
  // EMPTY SONG
  // ==========================================================

  if (!currentSong) {
    return null;
  }


  return (

    <div className="lyrics-overlay">

      <div className="lyrics-panel">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="lyrics-header">

          <div>

            <span className="lyrics-eyebrow">
              YOVI LYRICS
            </span>


            <h2>
              {currentSong.title}
            </h2>


            <p>
              {currentSong.artist}
            </p>

          </div>


          <button
            className="lyrics-close"
            onClick={onClose}
            aria-label="Close lyrics"
          >

            <X size={20} />

          </button>

        </div>


        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="lyrics-content">


          {/* ARTWORK */}

          <div className="lyrics-artwork">

            {currentSong.image ? (

              <img
                src={currentSong.image}
                alt={currentSong.title}
              />

            ) : (

              <div className="lyrics-artwork-empty">

                <Music2 size={42} />

              </div>

            )}

          </div>


          {/* LYRICS */}

          <div className="lyrics-lines">


            {/* LOADING */}

            {loading && (

              <div className="lyrics-state">

                <LoaderCircle
                  size={24}
                  className="lyrics-spinner"
                />

                <h3>
                  Finding lyrics...
                </h3>

                <p>
                  YOVI is looking for the
                  best available lyrics.
                </p>

              </div>

            )}


            {/* ERROR */}

            {!loading &&
              error && (

                <div className="lyrics-state">

                  <Music2 size={28} />

                  <h3>
                    Couldn't load lyrics
                  </h3>

                  <p>
                    {error}
                  </p>

                </div>

              )}


            {/* NOT FOUND */}

            {!loading &&
              !error &&
              lyrics &&
              !lyrics.found && (

                <div className="lyrics-state">

                  <Music2 size={28} />

                  <h3>
                    Lyrics unavailable
                  </h3>

                  <p>
                    Lyrics aren't available
                    for this track yet.
                  </p>

                </div>

              )}


            {/* ACTUAL LYRICS */}

            {!loading &&
              !error &&
              lyrics?.found &&
              lyricLines.length > 0 && (

                <div className="lyrics-scroll">

                  {lyricLines.map(
                    (line, index) => {

                      const isActive =
                        index === activeIndex;


                      let className =
                        "lyrics-line";


                      if (isActive) {

                        className +=
                          " active";

                      } else if (
                        activeIndex >= 0 &&
                        Math.abs(
                          index -
                          activeIndex
                        ) === 1
                      ) {

                        className +=
                          " near";

                      } else {

                        className +=
                          " faded";

                      }


                      return (

                        <p
                          key={`${index}-${line.time ?? "plain"}`}
                          ref={
                            isActive
                              ? activeLineRef
                              : null
                          }
                          className={
                            className
                          }
                        >

                          {line.text}

                        </p>

                      );

                    }
                  )}

                </div>

              )}


            {/* FOUND BUT EMPTY */}

            {!loading &&
              !error &&
              lyrics?.found &&
              lyricLines.length === 0 && (

                <div className="lyrics-state">

                  <Music2 size={28} />

                  <h3>
                    Lyrics unavailable
                  </h3>

                  <p>
                    This track doesn't have
                    readable lyrics available.
                  </p>

                </div>

              )}

          </div>

        </div>

      </div>

    </div>

  );

}


export default LyricsPanel;