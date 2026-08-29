import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { findYouTubeSong } from "../services/youtube";

import {
  recordListeningEvent,
} from "../services/listeningService";

import { useJam } from "./JamContext";
import { useAuth } from "./AuthContext";

import {
  getLibrary,
  addSongToLibrary as addSongToLibraryApi,
  removeSongFromLibrary as removeSongFromLibraryApi,
  getFavorites,
  addSongToFavorites as addSongToFavoritesApi,
  removeSongFromFavorites as removeSongFromFavoritesApi,
  getPlaylists,
  createPlaylist as createPlaylistApi,
  deletePlaylist as deletePlaylistApi,
  addSongToPlaylist as addSongToPlaylistApi,
  removeSongFromPlaylist as removeSongFromPlaylistApi,
} from "../services/collectionService";


const PlayerContext =
  createContext(null);


// ============================================================
// SONG IDENTITY
// ============================================================

function getSongIdentity(song) {

  if (!song) {
    return null;
  }


  return [
    song.provider ?? "",
    song.id ?? "",
    song.video_id ?? "",
    song.youtubeVideoId ?? "",
    song.title ?? "",
    song.artist ?? "",
  ]
    .join("|")
    .toLowerCase();

}


function isSameSong(
  first,
  second
) {

  if (
    !first ||
    !second
  ) {
    return false;
  }


  return (
    getSongIdentity(first) ===
    getSongIdentity(second)
  );

}


// ============================================================
// PROVIDER
// ============================================================

export function PlayerProvider({
  children,
}) {

  const {
    user,
    isAuthenticated,
  } = useAuth();

  // ==========================================================
  // JAM
  // ==========================================================

  const {
    sessionId,
    isConnected: jamConnected,
    isHost,
    jamState,
    jamPlay,
    jamPause,
    jamSeek,
    jamSongChange,
  } = useJam();


  // ==========================================================
  // PLAYER STATE
  // ==========================================================

  const [
    currentSong,
    setCurrentSong,
  ] = useState(null);


  const [
    youtubeVideoId,
    setYoutubeVideoId,
  ] = useState(null);


  const [
    youtubeBootstrapId,
    setYoutubeBootstrapId,
  ] = useState(null);


  const [
    youtubeIds,
    setYoutubeIds,
  ] = useState({});


  const [
    youtubeReady,
    setYoutubeReady,
  ] = useState(false);


  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);


  const [
    isLoading,
    setIsLoading,
  ] = useState(false);


  const [
    player,
    setPlayer,
  ] = useState(null);


  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);


  const [
    duration,
    setDuration,
  ] = useState(0);


  const [
    volume,
    setVolume,
  ] = useState(100);


  // ==========================================================
  // COLLECTIONS
  // ==========================================================

  const [
    recentlyPlayed,
    setRecentlyPlayed,
  ] = useState([]);


  const [
    library,
    setLibrary,
  ] = useState([]);


  const [
    favorites,
    setFavorites,
  ] = useState([]);


  const [
    playlists,
    setPlaylists,
  ] = useState({});


  const collectionLoadingRef =
    useRef(false);


  // ==========================================================
  // QUEUE
  // ==========================================================

  const [
    queue,
    setQueue,
  ] = useState([]);


  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(-1);


  // ==========================================================
  // PLAYER REFS
  // ==========================================================

  const playerRef =
    useRef(null);


  const progressTimer =
    useRef(null);


  const playRequestId =
    useRef(0);


  const youtubeReadyRef =
    useRef(false);


  // ==========================================================
  // YOUTUBE CACHE
  // ==========================================================

  const youtubeCacheRef =
    useRef(new Map());


  const youtubeInFlightRef =
    useRef(new Map());


  // ==========================================================
  // LIVE REFS
  // ==========================================================

  const currentTimeRef =
    useRef(0);


  const durationRef =
    useRef(0);


  const isPlayingRef =
    useRef(false);


  const volumeRef =
    useRef(100);


  useEffect(() => {

    currentTimeRef.current =
      currentTime;

  }, [
    currentTime,
  ]);


  useEffect(() => {

    durationRef.current =
      duration;

  }, [
    duration,
  ]);


  useEffect(() => {

    isPlayingRef.current =
      isPlaying;

  }, [
    isPlaying,
  ]);


  useEffect(() => {

    volumeRef.current =
      volume;

  }, [
    volume,
  ]);


  // ==========================================================
  // JAM REFS
  // ==========================================================

  /*
   * Jam playback has to distinguish between:
   *
   * 1. A real local host action.
   * 2. A playback action caused by an incoming Jam event.
   *
   * Only real host actions are broadcast.
   */

  const applyingJamEvent =
    useRef(false);


  const pendingJamSong =
    useRef(null);


  const pendingJamPosition =
    useRef(0);


  const pendingJamPlay =
    useRef(false);


  const pendingJamPause =
    useRef(false);


  const lastJamSongId =
    useRef(null);


  const currentSongRef =
    useRef(null);


  const jamStateRef =
    useRef(null);


  const jamConnectedRef =
    useRef(false);


  const isHostRef =
    useRef(false);


  // A React state tick used to re-run Jam synchronization after
  // asynchronous YouTube loading completes. Refs alone do not
  // trigger effects when they are cleared.
  const [jamSyncVersion, setJamSyncVersion] = useState(0);

  const autoplayAfterReadyRef = useRef(false);
  const autoplayRetryTimerRef = useRef(null);


  useEffect(() => {

    currentSongRef.current =
      currentSong;

  }, [
    currentSong,
  ]);


  useEffect(() => {

    jamStateRef.current =
      jamState;

  }, [
    jamState,
  ]);


  useEffect(() => {

    jamConnectedRef.current =
      jamConnected;

  }, [
    jamConnected,
  ]);


  useEffect(() => {

    isHostRef.current =
      isHost;

  }, [
    isHost,
  ]);


  useEffect(() => {
    return () => {
      if (autoplayRetryTimerRef.current) {
        clearTimeout(autoplayRetryTimerRef.current);
        autoplayRetryTimerRef.current = null;
      }
    };
  }, []);


  // ==========================================================
  // LOAD USER COLLECTIONS
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadUserCollections() {

      if (!isAuthenticated || !user?.id) {

        setLibrary([]);
        setFavorites([]);
        setPlaylists({});
        setRecentlyPlayed([]);

        return;

      }


      collectionLoadingRef.current = true;


      try {

        const [
          libraryData,
          favoriteData,
          playlistData,
        ] = await Promise.all([
          getLibrary(),
          getFavorites(),
          getPlaylists(),
        ]);


        if (cancelled) {
          return;
        }


        setLibrary(
          Array.isArray(libraryData)
            ? libraryData
            : []
        );


        setFavorites(
          Array.isArray(favoriteData)
            ? favoriteData
            : []
        );


        const playlistMap = {};


        if (Array.isArray(playlistData)) {

          playlistData.forEach((playlist) => {

            if (!playlist?.name) {
              return;
            }

            playlistMap[playlist.name] = {
              id: playlist.id,
              songs: Array.isArray(playlist.songs)
                ? playlist.songs
                : [],
            };

          });

        }


        setPlaylists(playlistMap);

      } catch (error) {

        if (cancelled) {
          return;
        }

        console.error(
          "YOVI user collections load failed:",
          error
        );

        setLibrary([]);
        setFavorites([]);
        setPlaylists({});

      } finally {

        if (!cancelled) {
          collectionLoadingRef.current = false;
        }

      }

    }


    void loadUserCollections();


    return () => {
      cancelled = true;
    };

  }, [
    isAuthenticated,
    user?.id,
  ]);


  // ==========================================================
  // LISTENING REFS
  // ==========================================================

  const listeningSongRef =
    useRef(null);


  const listeningStartedRef =
    useRef(false);


  const lastListeningProgressRef =
    useRef(0);


  const lastListeningPauseRef =
    useRef(0);


  // ==========================================================
  // PLAYER REF SYNC
  // ==========================================================

  useEffect(() => {

    playerRef.current =
      player;

  }, [
    player,
  ]);


  // ==========================================================
  // LISTENING EVENT
  // ==========================================================

  const sendListeningEvent =
    useCallback(
      (
        eventType,
        song =
          listeningSongRef.current,
        positionSeconds =
          currentTimeRef.current,
        durationSeconds =
          durationRef.current
      ) => {

        if (
          !song ||
          !eventType
        ) {
          return;
        }


        const numericPosition =
          Number(
            positionSeconds
          );


        const numericDuration =
          Number(
            durationSeconds
          );


        const safePosition =
          Number.isFinite(
            numericPosition
          )
            ? Math.max(
                0,
                numericPosition
              )
            : 0;


        const safeDuration =
          Number.isFinite(
            numericDuration
          )
            ? Math.max(
                0,
                numericDuration
              )
            : 0;


        void recordListeningEvent({
          song,
          eventType,
          positionSeconds:
            safePosition,
          durationSeconds:
            safeDuration,
        });

      },
      []
    );


  // ==========================================================
  // PROGRESS TRACKING
  // ==========================================================

  const stopProgressTracking =
    useCallback(() => {

      if (
        progressTimer.current
      ) {

        clearInterval(
          progressTimer.current
        );


        progressTimer.current =
          null;

      }

    }, []);


  const startProgressTracking =
    useCallback(() => {

      stopProgressTracking();


      progressTimer.current =
        setInterval(() => {

          const activePlayer =
            playerRef.current;


          if (!activePlayer) {
            return;
          }


          try {

            const time =
              activePlayer.getCurrentTime();


            const total =
              activePlayer.getDuration();


            if (
              Number.isFinite(
                time
              )
            ) {

              setCurrentTime(
                time
              );


              currentTimeRef.current =
                time;

            }


            if (
              Number.isFinite(
                total
              ) &&
              total > 0
            ) {

              setDuration(
                total
              );


              durationRef.current =
                total;

            }


            if (
              listeningStartedRef.current &&
              Number.isFinite(time) &&
              Number.isFinite(total) &&
              total > 0 &&
              time >= 15 &&
              (
                time -
                lastListeningProgressRef.current
              ) >= 15
            ) {

              lastListeningProgressRef.current =
                time;


              sendListeningEvent(
                "progress",
                listeningSongRef.current,
                time,
                total
              );

            }

          } catch {

            // Player may not be ready.

          }

        }, 500);

    }, [
      sendListeningEvent,
      stopProgressTracking,
    ]);


  useEffect(() => {

    return () => {

      stopProgressTracking();

    };

  }, [
    stopProgressTracking,
  ]);


  // ==========================================================
  // YOUTUBE PREFETCH / CACHE
  // ==========================================================

  const primeSong =
    useCallback(
      async (song) => {

        if (
          !song?.title ||
          !song?.artist
        ) {
          return null;
        }


        const identity =
          getSongIdentity(
            song
          );


        if (!identity) {
          return null;
        }


        const existingVideoId =
          song.youtubeVideoId ??
          song.video_id ??
          null;


        if (
          existingVideoId
        ) {

          youtubeCacheRef.current.set(
            identity,
            existingVideoId
          );


          setYoutubeIds(
            (previous) => {

              if (
                previous[identity] ===
                existingVideoId
              ) {
                return previous;
              }


              return {
                ...previous,
                [identity]:
                  existingVideoId,
              };

            }
          );


          setYoutubeBootstrapId(
            (previous) =>
              previous ??
              existingVideoId
          );


          return existingVideoId;

        }


        const cached =
          youtubeCacheRef.current.get(
            identity
          );


        if (cached) {

          setYoutubeIds(
            (previous) => {

              if (
                previous[identity] ===
                cached
              ) {
                return previous;
              }


              return {
                ...previous,
                [identity]:
                  cached,
              };

            }
          );


          setYoutubeBootstrapId(
            (previous) =>
              previous ??
              cached
          );


          return cached;

        }


        /*
         * IMPORTANT:
         *
         * Do not search YouTube here.
         * This protects API quota.
         */

        return null;

      },
      []
    );


  // ==========================================================
  // RESOLVE YOUTUBE FOR PLAYBACK
  // ==========================================================

  const resolveYouTubeForPlayback =
    useCallback(
      async (song) => {

        if (
          !song?.title ||
          !song?.artist
        ) {
          return null;
        }


        const identity =
          getSongIdentity(
            song
          );


        if (!identity) {
          return null;
        }


        const existingVideoId =
          song.youtubeVideoId ??
          song.video_id ??
          null;


        // ------------------------------------------------------
        // EXISTING VIDEO ID
        // ------------------------------------------------------

        if (
          existingVideoId
        ) {

          youtubeCacheRef.current.set(
            identity,
            existingVideoId
          );


          setYoutubeIds(
            (previous) => {

              if (
                previous[identity] ===
                existingVideoId
              ) {
                return previous;
              }


              return {
                ...previous,
                [identity]:
                  existingVideoId,
              };

            }
          );


          setYoutubeBootstrapId(
            (previous) =>
              previous ??
              existingVideoId
          );


          return existingVideoId;

        }


        // ------------------------------------------------------
        // CACHE
        // ------------------------------------------------------

        const cached =
          youtubeCacheRef.current.get(
            identity
          );


        if (cached) {

          setYoutubeIds(
            (previous) => {

              if (
                previous[identity] ===
                cached
              ) {
                return previous;
              }


              return {
                ...previous,
                [identity]:
                  cached,
              };

            }
          );


          setYoutubeBootstrapId(
            (previous) =>
              previous ??
              cached
          );


          return cached;

        }


        // ------------------------------------------------------
        // EXISTING REQUEST
        // ------------------------------------------------------

        const existingRequest =
          youtubeInFlightRef.current.get(
            identity
          );


        if (
          existingRequest
        ) {

          const videoId =
            await existingRequest;


          if (videoId) {

            setYoutubeIds(
              (previous) => {

                if (
                  previous[identity] ===
                  videoId
                ) {
                  return previous;
                }


                return {
                  ...previous,
                  [identity]:
                    videoId,
                };

              }
            );


            setYoutubeBootstrapId(
              (previous) =>
                previous ??
                videoId
            );

          }


          return videoId;

        }


        // ------------------------------------------------------
        // NETWORK REQUEST
        // ------------------------------------------------------

        const request =
          (async () => {

            try {

              console.log(
                "[YOVI] Resolving YouTube for playback:",
                song.title
              );


              const data =
                await findYouTubeSong(
                  song.title,
                  song.artist
                );


              const videoId =
                data?.results?.[0]?.video_id ??
                null;


              if (!videoId) {
                return null;
              }


              youtubeCacheRef.current.set(
                identity,
                videoId
              );


              return videoId;

            } catch (error) {

              console.error(
                "YouTube playback resolution failed:",
                error
              );


              return null;

            } finally {

              youtubeInFlightRef.current.delete(
                identity
              );

            }

          })();


        youtubeInFlightRef.current.set(
          identity,
          request
        );


        const videoId =
          await request;


        if (videoId) {

          setYoutubeIds(
            (previous) => {

              if (
                previous[identity] ===
                videoId
              ) {
                return previous;
              }


              return {
                ...previous,
                [identity]:
                  videoId,
              };

            }
          );


          setYoutubeBootstrapId(
            (previous) =>
              previous ??
              videoId
          );

        }


        return videoId;

      },
      []
    );


  // ==========================================================
  // SONG READY
  // ==========================================================

  const isSongReady =
    useCallback(
      (song) => {

        if (!song) {
          return false;
        }


        const identity =
          getSongIdentity(
            song
          );


        const videoId =
          song.youtubeVideoId ??
          song.video_id ??
          youtubeIds[identity] ??
          youtubeCacheRef.current.get(
            identity
          );


        return Boolean(
          videoId &&
          youtubeReadyRef.current &&
          playerRef.current
        );

      },
      [
        youtubeIds,
      ]
    );


  // ==========================================================
  // PLAY SONG
  // ==========================================================

  const playSong =
    useCallback(
      async (
        song,
        songQueue = [],
        options = {}
      ) => {

        if (
          !song?.title ||
          !song?.artist
        ) {

          console.warn(
            "Invalid song:",
            song
          );


          return false;

        }


        const fromJam =
          options.fromJam === true;


        const jamPosition =
          Number(
            options.jamPosition ?? 0
          );


        const identity =
          getSongIdentity(
            song
          );


        let videoId =
          song.youtubeVideoId ??
          song.video_id ??
          youtubeIds[identity] ??
          youtubeCacheRef.current.get(
            identity
          );


        // ------------------------------------------------------
        // RESOLVE WHEN NECESSARY
        // ------------------------------------------------------

        if (!videoId) {

          videoId =
            await resolveYouTubeForPlayback(
              song
            );

        }


        // ------------------------------------------------------
        // RESOLUTION FAILED
        // ------------------------------------------------------

        if (!videoId) {

          setIsLoading(
            false
          );


          console.warn(
            "No YouTube video available for:",
            song.title,
            song.artist
          );


          if (fromJam) {

            pendingJamSong.current =
              song;


            pendingJamPosition.current =
              Number.isFinite(
                jamPosition
              )
                ? Math.max(
                    0,
                    jamPosition
                  )
                : 0;


            pendingJamPlay.current =
              Boolean(
                jamStateRef.current?.isPlaying
              );


            pendingJamPause.current =
              !Boolean(
                jamStateRef.current?.isPlaying
              );

          }


          return false;

        }


        const resolvedSong = {
          ...song,
          youtubeVideoId:
            videoId,
        };


        // ------------------------------------------------------
        // PLAYER NOT READY
        // ------------------------------------------------------

        const activePlayer =
          playerRef.current;


        if (
          !activePlayer ||
          !youtubeReadyRef.current
        ) {

          setIsLoading(
            true
          );


          setCurrentSong(
            resolvedSong
          );


          setYoutubeVideoId(
            videoId
          );

          // The YouTube iframe is created from youtubeBootstrapId.
          // A Jam song can already contain its videoId, so make sure
          // the player is mounted even when no previous song was played.
          setYoutubeBootstrapId(
            (previous) => previous ?? videoId
          );

          if (!fromJam) {
            // Preserve a normal user's first click while the iframe
            // is being mounted/initialized.
            autoplayAfterReadyRef.current = true;
          }

          if (fromJam) {

            pendingJamSong.current =
              resolvedSong;


            pendingJamPosition.current =
              Number.isFinite(
                jamPosition
              )
                ? Math.max(
                    0,
                    jamPosition
                  )
                : 0;


            pendingJamPlay.current =
              Boolean(
                jamStateRef.current?.isPlaying
              );


            pendingJamPause.current =
              !Boolean(
                jamStateRef.current?.isPlaying
              );

          }


          return false;

        }


        ++playRequestId.current;


        setIsLoading(
          true
        );


        stopProgressTracking();


        // ------------------------------------------------------
        // LISTENING
        // ------------------------------------------------------

        if (
          listeningSongRef.current &&
          listeningStartedRef.current &&
          !isSameSong(
            listeningSongRef.current,
            resolvedSong
          )
        ) {

          sendListeningEvent(
            "pause",
            listeningSongRef.current,
            currentTimeRef.current,
            durationRef.current
          );

        }


        listeningSongRef.current =
          resolvedSong;


        listeningStartedRef.current =
          false;


        lastListeningProgressRef.current =
          0;


        lastListeningPauseRef.current =
          0;


        // ------------------------------------------------------
        // PLAYER STATE
        // ------------------------------------------------------

        setCurrentSong(
          resolvedSong
        );


        setYoutubeVideoId(
          videoId
        );


        setIsPlaying(
          false
        );


        isPlayingRef.current =
          false;


        const initialPosition =
          fromJam &&
          Number.isFinite(
            jamPosition
          )
            ? Math.max(
                0,
                jamPosition
              )
            : 0;


        setCurrentTime(
          initialPosition
        );


        currentTimeRef.current =
          initialPosition;


        setDuration(
          0
        );


        durationRef.current =
          0;


        // ------------------------------------------------------
        // QUEUE
        // ------------------------------------------------------

        const validQueue =
          songQueue?.length
            ? songQueue
            : [resolvedSong];


        const resolvedQueue =
          validQueue.map(
            (item) => {

              const itemId =
                item.youtubeVideoId ??
                item.video_id ??
                youtubeCacheRef.current.get(
                  getSongIdentity(item)
                );


              return itemId
                ? {
                    ...item,
                    youtubeVideoId:
                      itemId,
                  }
                : item;

            }
          );


        setQueue(
          resolvedQueue
        );


        const index =
          resolvedQueue.findIndex(
            (item) =>
              isSameSong(
                item,
                resolvedSong
              )
          );


        setCurrentIndex(
          index >= 0
            ? index
            : 0
        );


        // ------------------------------------------------------
        // RECENTLY PLAYED
        // ------------------------------------------------------

        setRecentlyPlayed(
          (previous) => {

            const withoutDuplicate =
              previous.filter(
                (item) =>
                  !isSameSong(
                    item,
                    resolvedSong
                  )
              );


            return [
              resolvedSong,
              ...withoutDuplicate,
            ].slice(
              0,
              10
            );

          }
        );


        // ------------------------------------------------------
        // CLEAR JAM SONG PENDING STATE
        // ------------------------------------------------------

        if (fromJam) {

          pendingJamSong.current =
            null;


          pendingJamPosition.current =
            initialPosition;

        }


        // ------------------------------------------------------
        // YOUTUBE PLAYBACK
        // ------------------------------------------------------

        try {

          activePlayer.unMute();


          activePlayer.setVolume(
            volumeRef.current
          );


          if (fromJam) {

            activePlayer.loadVideoById({
              videoId,
              startSeconds:
                initialPosition,
            });

          } else {

            activePlayer.loadVideoById(
              videoId
            );

          }


          /*
           * A Jam SONG_CHANGE represents a song
           * that should follow the current Jam
           * playback state.
           *
           * For a newly received Jam song we
           * allow the synchronization effect
           * to decide Play vs Pause.
           *
           * Normal playback always plays.
           */

          if (!fromJam) {

            activePlayer.playVideo();

          }

        } catch (error) {

          console.error(
            "YouTube playback failed:",
            error
          );


          setIsPlaying(
            false
          );


          isPlayingRef.current =
            false;


          setIsLoading(
            false
          );


          return false;

        }


        // ------------------------------------------------------
        // JAM HOST
        // ------------------------------------------------------

        if (
          jamConnected &&
          isHost &&
          !fromJam
        ) {

          lastJamSongId.current =
            getSongIdentity(
              resolvedSong
            );


          jamSongChange(
            resolvedSong,
            0
          );

        }


        return true;

      },
      [
        jamConnected,
        isHost,
        jamSongChange,
        resolveYouTubeForPlayback,
        sendListeningEvent,
        stopProgressTracking,
        youtubeIds,
      ]
    );


  // ==========================================================
  // QUEUE
  // ==========================================================

  const addToQueue = (
    song
  ) => {

    if (!song) {
      return;
    }


    setQueue(
      (previousQueue) => {

        if (
          previousQueue.some(
            (item) =>
              isSameSong(
                item,
                song
              )
          )
        ) {
          return previousQueue;
        }


        return [
          ...previousQueue,
          song,
        ];

      }
    );

  };


  const playNextSong = (
    song
  ) => {

    if (!song) {
      return;
    }


    setQueue(
      (previousQueue) => {

        const updatedQueue = [
          ...previousQueue,
        ];


        const currentPosition =
          updatedQueue.findIndex(
            (item) =>
              isSameSong(
                item,
                currentSongRef.current
              )
          );


        const existingIndex =
          updatedQueue.findIndex(
            (item) =>
              isSameSong(
                item,
                song
              )
          );


        if (
          existingIndex !== -1
        ) {

          updatedQueue.splice(
            existingIndex,
            1
          );

        }


        const newCurrentPosition =
          updatedQueue.findIndex(
            (item) =>
              isSameSong(
                item,
                currentSongRef.current
              )
          );


        const insertIndex =
          newCurrentPosition === -1
            ? Math.max(
                0,
                currentPosition + 1
              )
            : newCurrentPosition + 1;


        updatedQueue.splice(
          insertIndex,
          0,
          song
        );


        return updatedQueue;

      }
    );

  };


  // ==========================================================
  // LIBRARY
  // ==========================================================

  const addToLibrary = useCallback(
    async (song) => {

      if (
        !song ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      try {

        const saved =
          await addSongToLibraryApi(
            song
          );


        setLibrary(
          (previous) => {

            if (
              previous.some(
                (item) =>
                  isSameSong(
                    item,
                    song
                  )
              )
            ) {
              return previous;
            }


            return [
              saved ?? song,
              ...previous,
            ];

          }
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI add to library failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
    ]
  );


  const removeFromLibrary = useCallback(
    async (song) => {

      if (
        !song ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      const existing =
        library.find(
          (item) =>
            isSameSong(
              item,
              song
            )
        );


      if (!existing) {
        return false;
      }


      try {

        if (existing.id != null) {

          await removeSongFromLibraryApi(
            existing.id
          );

        }


        setLibrary(
          (previous) =>
            previous.filter(
              (item) =>
                !isSameSong(
                  item,
                  song
                )
            )
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI remove from library failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
      library,
    ]
  );


  const isInLibrary = useCallback(
    (song) => {

      return Boolean(
        song &&
        library.some(
          (item) =>
            isSameSong(
              item,
              song
            )
        )
      );

    },
    [
      library,
    ]
  );


  // ==========================================================
  // FAVORITES
  // ==========================================================

  const addToFavorites = useCallback(
    async (song) => {

      if (
        !song ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      try {

        const saved =
          await addSongToFavoritesApi(
            song
          );


        setFavorites(
          (previous) => {

            if (
              previous.some(
                (item) =>
                  isSameSong(
                    item,
                    song
                  )
              )
            ) {
              return previous;
            }


            return [
              saved ?? song,
              ...previous,
            ];

          }
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI add to favorites failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
    ]
  );


  const removeFromFavorites = useCallback(
    async (song) => {

      if (
        !song ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      const existing =
        favorites.find(
          (item) =>
            isSameSong(
              item,
              song
            )
        );


      if (!existing) {
        return false;
      }


      try {

        if (existing.id != null) {

          await removeSongFromFavoritesApi(
            existing.id
          );

        }


        setFavorites(
          (previous) =>
            previous.filter(
              (item) =>
                !isSameSong(
                  item,
                  song
                )
            )
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI remove from favorites failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
      favorites,
    ]
  );


  const isFavorite = useCallback(
    (song) => {

      return Boolean(
        song &&
        favorites.some(
          (item) =>
            isSameSong(
              item,
              song
            )
        )
      );

    },
    [
      favorites,
    ]
  );


  // ==========================================================
  // PLAYLISTS
  // ==========================================================

  const createPlaylist = useCallback(
    async (name) => {

      const cleanName =
        String(
          name ?? ""
        ).trim();


      if (
        !cleanName ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      if (
        Object.prototype.hasOwnProperty.call(
          playlists,
          cleanName
        )
      ) {
        return false;
      }


      try {

        const created =
          await createPlaylistApi(
            cleanName
          );


        setPlaylists(
          (previous) => ({
            ...previous,
            [cleanName]: {
              id: created?.id,
              songs: Array.isArray(
                created?.songs
              )
                ? created.songs
                : [],
            },
          })
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI create playlist failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
      playlists,
    ]
  );


  const addToPlaylist = useCallback(
    async (
      playlistName,
      song
    ) => {

      const cleanName =
        String(
          playlistName ?? ""
        ).trim();


      if (
        !cleanName ||
        !song ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      const playlist =
        playlists[cleanName];


      if (!playlist?.id) {

        console.warn(
          "YOVI playlist not found:",
          cleanName
        );


        return false;

      }


      const existing =
        playlist.songs ?? [];


      if (
        existing.some(
          (item) =>
            isSameSong(
              item,
              song
            )
        )
      ) {
        return true;
      }


      try {

        const saved =
          await addSongToPlaylistApi(
            playlist.id,
            song
          );


        setPlaylists(
          (previous) => {

            const current =
              previous[cleanName];


            if (!current) {
              return previous;
            }


            const currentSongs =
              current.songs ?? [];


            if (
              currentSongs.some(
                (item) =>
                  isSameSong(
                    item,
                    song
                  )
              )
            ) {
              return previous;
            }


            return {
              ...previous,
              [cleanName]: {
                ...current,
                songs: [
                  ...currentSongs,
                  saved ?? song,
                ],
              },
            };

          }
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI add to playlist failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
      playlists,
    ]
  );


  const removeFromPlaylist = useCallback(
    async (
      playlistName,
      song
    ) => {

      const cleanName =
        String(
          playlistName ?? ""
        ).trim();


      if (
        !cleanName ||
        !song ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      const playlist =
        playlists[cleanName];


      if (!playlist?.id) {
        return false;
      }


      const existing =
        (playlist.songs ?? []).find(
          (item) =>
            isSameSong(
              item,
              song
            )
        );


      if (!existing) {
        return false;
      }


      try {

        if (existing.id != null) {

          await removeSongFromPlaylistApi(
            playlist.id,
            existing.id
          );

        }


        setPlaylists(
          (previous) => {

            const current =
              previous[cleanName];


            if (!current) {
              return previous;
            }


            return {
              ...previous,
              [cleanName]: {
                ...current,
                songs: (
                  current.songs ?? []
                ).filter(
                  (item) =>
                    !isSameSong(
                      item,
                      song
                    )
                ),
              },
            };

          }
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI remove from playlist failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
      playlists,
    ]
  );


  const deletePlaylist = useCallback(
    async (playlistName) => {

      const cleanName =
        String(
          playlistName ?? ""
        ).trim();


      if (
        !cleanName ||
        !isAuthenticated ||
        !user?.id
      ) {
        return false;
      }


      const playlist =
        playlists[cleanName];


      if (!playlist?.id) {
        return false;
      }


      try {

        await deletePlaylistApi(
          playlist.id
        );


        setPlaylists(
          (previous) => {

            const next = {
              ...previous,
            };


            delete next[cleanName];


            return next;

          }
        );


        return true;

      } catch (error) {

        console.error(
          "YOVI delete playlist failed:",
          error
        );


        return false;

      }

    },
    [
      isAuthenticated,
      user?.id,
      playlists,
    ]
  );


  // ==========================================================
  // JAM SONG SYNCHRONIZATION
  // ==========================================================

  /*
   * This effect reacts ONLY when the Jam's
   * current song changes.
   *
   * It does not try to decide whether the
   * guest should play or pause.
   *
   * That is handled by the playback effect.
   */

  useEffect(() => {

    if (
      !jamConnected ||
      !jamState?.currentSong
    ) {
      return;
    }


    const jamSong =
      jamState.currentSong;


    const jamSongId =
      getSongIdentity(
        jamSong
      );


    if (!jamSongId) {
      return;
    }


    /*
     * Same song:
     *
     * Do not reload it.
     */

    if (
      lastJamSongId.current ===
      jamSongId
    ) {

      pendingJamPosition.current =
        Number.isFinite(
          Number(
            jamState.position
          )
        )
          ? Math.max(
              0,
              Number(
                jamState.position
              )
            )
          : 0;


      return;

    }


    /*
     * New Jam song.
     */

    lastJamSongId.current =
      jamSongId;


    const rawPosition =
      Number(
        jamState.position ?? 0
      );


    const safePosition =
      Number.isFinite(
        rawPosition
      )
        ? Math.max(
            0,
            rawPosition
          )
        : 0;


    pendingJamSong.current =
      jamSong;


    pendingJamPosition.current =
      safePosition;


    pendingJamPlay.current =
      Boolean(
        jamState.isPlaying
      );


    pendingJamPause.current =
      !Boolean(
        jamState.isPlaying
      );


    /*
     * IMPORTANT:
     *
     * We do not call playVideo() inside
     * this effect.
     *
     * The playback effect below decides
     * whether the guest should play or pause.
     */

    void playSong(
      jamSong,
      [jamSong],
      {
        fromJam: true,
        jamPosition:
          safePosition,
      }
    );

  }, [
    jamConnected,
    jamState?.currentSong,
    playSong,
  ]);


  // ==========================================================
  // JAM SONG LOADING
  // ==========================================================

  useEffect(() => {

    if (
      !jamConnected ||
      !player ||
      !youtubeReadyRef.current
    ) {
      return;
    }


    const pendingSong =
      pendingJamSong.current;


    if (!pendingSong) {
      return;
    }


    const identity =
      getSongIdentity(
        pendingSong
      );


    const videoId =
      pendingSong.youtubeVideoId ??
      pendingSong.video_id ??
      youtubeIds[identity] ??
      youtubeCacheRef.current.get(
        identity
      );


    if (!videoId) {
      return;
    }


    const position =
      Number(
        pendingJamPosition.current
      );


    try {

      applyingJamEvent.current =
        true;


      player.unMute();


      player.setVolume(
        volumeRef.current
      );


      player.loadVideoById({

        videoId,

        startSeconds:
          Number.isFinite(position)
            ? Math.max(
                0,
                position
              )
            : 0,

      });


      /*
       * The song has now been handed to
       * YouTube.
       */

      pendingJamSong.current =
        null;


      pendingJamPlay.current =
        Boolean(
          jamStateRef.current?.isPlaying
        );


      pendingJamPause.current =
        !Boolean(
          jamStateRef.current?.isPlaying
        );

      // SONG_CHANGE and PLAY arrive separately. Give YouTube a moment
      // to process loadVideoById(), then re-run synchronization using
      // the latest Jam state rather than the stale state at load time.
      setTimeout(() => {
        setJamSyncVersion((value) => value + 1);
      }, 250);

    } catch (error) {

      console.error(
        "YOVI Jam song loading failed:",
        error
      );


      applyingJamEvent.current =
        false;

    }

  }, [
    jamConnected,
    player,
    youtubeIds,
    jamState?.isPlaying,
    jamState?.position,
  ]);


  // ==========================================================
  // JAM PLAYBACK SYNCHRONIZATION
  // ==========================================================

  /*
   * THIS IS THE IMPORTANT FIX.
   *
   * We ask the YouTube player for its ACTUAL
   * state instead of relying on React's
   * isPlaying state.
   *
   * YouTube states:
   *
   * -1 = unstarted
   *  0 = ended
   *  1 = playing
   *  2 = paused
   *  3 = buffering
   *  5 = video cued
   */

  useEffect(() => {

    if (
      !jamConnected ||
      !player ||
      !youtubeReadyRef.current ||
      !jamState
    ) {
      return;
    }


    /*
     * If a Jam song hasn't reached the player
     * yet, wait.
     */

    // A pending song is handled by the loading effect. Once that effect
    // hands the song to YouTube it bumps jamSyncVersion, which re-runs
    // this effect against the latest Jam state.
    if (pendingJamSong.current) {
      return;
    }


    try {

      const targetPosition =
        Number(
          jamState.position ?? 0
        );


      // ======================================================
      // POSITION
      // ======================================================

      if (
        Number.isFinite(
          targetPosition
        )
      ) {

        const localPosition =
          Number(
            currentTimeRef.current
          );


        /*
         * Only correct meaningful drift.
         *
         * Small differences are normal.
         */

        if (
          Math.abs(
            localPosition -
            targetPosition
          ) > 2
        ) {

          applyingJamEvent.current =
            true;


          player.seekTo(
            Math.max(
              0,
              targetPosition
            ),
            true
          );

        }

      }


      // ======================================================
      // PLAY
      // ======================================================

      if (
        jamState.isPlaying
      ) {

        let playerState =
          -1;


        try {

          playerState =
            player.getPlayerState();

        } catch {
          playerState =
            -1;
        }


        /*
         * If the guest is already playing
         * or buffering, leave it alone.
         */

        if (
          playerState === 1 ||
          playerState === 3
        ) {

          return;

        }


        applyingJamEvent.current =
          true;


        pendingJamPlay.current =
          true;


        pendingJamPause.current =
          false;


        player.unMute();


        player.setVolume(
          volumeRef.current
        );


        player.playVideo();


        return;

      }


      // ======================================================
      // PAUSE
      // ======================================================

      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT use
       * isPlayingRef.current here.
       *
       * React state can lag behind YouTube.
       *
       * We inspect the actual iframe state.
       */

      if (
        !jamState.isPlaying
      ) {

        let playerState =
          -1;


        try {

          playerState =
            player.getPlayerState();

        } catch {
          playerState =
            -1;
        }


        /*
         * Pause if YouTube is currently
         * playing or buffering.
         */

        if (
          playerState === 1 ||
          playerState === 3
        ) {

          applyingJamEvent.current =
            true;


          pendingJamPause.current =
            true;


          pendingJamPlay.current =
            false;


          player.pauseVideo();

        }

      }

    } catch (error) {

      console.error(
        "YOVI Jam playback synchronization failed:",
        error
      );


      applyingJamEvent.current =
        false;

    }

  }, [
    jamConnected,
    jamState?.isPlaying,
    jamState?.position,
    player,
    jamSyncVersion,
  ]);


  // ==========================================================
  // NEXT
  // ==========================================================

  const playNext =
    async () => {

      if (!queue.length) {
        return;
      }


      const actualCurrentIndex =
        queue.findIndex(
          (item) =>
            isSameSong(
              item,
              currentSongRef.current
            )
        );


      const baseIndex =
        actualCurrentIndex >= 0
          ? actualCurrentIndex
          : currentIndex;


      const nextIndex =
        baseIndex + 1;


      if (
        nextIndex >=
        queue.length
      ) {

        setIsPlaying(
          false
        );


        isPlayingRef.current =
          false;


        return;

      }


      const nextSong =
        queue[nextIndex];


      /*
       * If we are the Jam host:
       *
       * playSong()
       *     ↓
       * SONG_CHANGE
       *     ↓
       * local YouTube play
       *     ↓
       * PLAY event
       *
       * Guest follows those events.
       */

      await playSong(
        nextSong,
        queue
      );

    };


  // ==========================================================
  // PREVIOUS
  // ==========================================================

  const playPrevious =
    async () => {

      if (!queue.length) {
        return;
      }


      /*
       * Standard player behavior:
       *
       * More than 3 seconds into song:
       * restart current song.
       */

      if (
        player &&
        currentTimeRef.current > 3
      ) {

        try {

          player.seekTo(
            0,
            true
          );


          setCurrentTime(
            0
          );


          currentTimeRef.current =
            0;


          /*
           * Only host broadcasts the seek.
           */

          if (
            jamConnected &&
            isHost
          ) {

            jamSeek(
              0
            );

          }


          return;

        } catch {
          // Continue to previous song.
        }

      }


      const actualCurrentIndex =
        queue.findIndex(
          (item) =>
            isSameSong(
              item,
              currentSongRef.current
            )
        );


      const baseIndex =
        actualCurrentIndex >= 0
          ? actualCurrentIndex
          : currentIndex;


      const previousIndex =
        baseIndex - 1;


      if (
        previousIndex < 0
      ) {

        return;

      }


      const previousSong =
        queue[previousIndex];


      await playSong(
        previousSong,
        queue
      );

    };


  // ==========================================================
  // YOUTUBE READY
  // ==========================================================

  const handlePlayerReady = (
    event
  ) => {

    const ytPlayer =
      event.target;


    setPlayer(
      ytPlayer
    );


    playerRef.current =
      ytPlayer;


    youtubeReadyRef.current =
      true;


    setYoutubeReady(
      true
    );


    try {

      const total =
        ytPlayer.getDuration();


      if (
        Number.isFinite(
          total
        ) &&
        total > 0
      ) {

        setDuration(
          total
        );


        durationRef.current =
          total;

      }

    } catch (error) {

      console.error(
        "YouTube player initialization failed:",
        error
      );

    }

    // The Jam SONG_CHANGE and PLAY messages are asynchronous.
    // Re-run synchronization once the YouTube iframe is actually ready.
    if (jamConnectedRef.current) {
      setJamSyncVersion((value) => value + 1);
    }

    // Preserve a normal user's first click if the iframe was not ready.
    if (autoplayAfterReadyRef.current) {
      autoplayAfterReadyRef.current = false;

      const tryPendingPlay = () => {
        const active = playerRef.current;
        if (!active) {
          return;
        }

        try {
          active.unMute();
          active.setVolume(volumeRef.current);
          active.playVideo();
        } catch {
          // The IFrame API may still be establishing its message channel.
        }
      };

      tryPendingPlay();

      if (autoplayRetryTimerRef.current) {
        clearTimeout(autoplayRetryTimerRef.current);
      }

      autoplayRetryTimerRef.current = setTimeout(() => {
        autoplayRetryTimerRef.current = null;
        tryPendingPlay();
      }, 350);
    }

  };


  // ==========================================================
  // YOUTUBE PLAY
  // ==========================================================

  const handlePlayerPlay =
    () => {

      setIsPlaying(
        true
      );


      isPlayingRef.current =
        true;


      setIsLoading(
        false
      );


      startProgressTracking();


      const activeSong =
        currentSongRef.current;


      if (
        activeSong &&
        !listeningStartedRef.current
      ) {

        listeningSongRef.current =
          activeSong;


        listeningStartedRef.current =
          true;


        lastListeningProgressRef.current =
          0;


        lastListeningPauseRef.current =
          0;


        sendListeningEvent(
          "play",
          activeSong,
          currentTimeRef.current,
          durationRef.current
        );

      }


      // ------------------------------------------------------
      // JAM HOST
      // ------------------------------------------------------

      if (
        jamConnected &&
        isHost
      ) {

        /*
         * If this Play came from an incoming
         * Jam event, NEVER broadcast it again.
         */

        if (
          pendingJamPlay.current ||
          applyingJamEvent.current
        ) {

          pendingJamPlay.current =
            false;


          applyingJamEvent.current =
            false;


          return;

        }


        let position =
          currentTimeRef.current;


        try {

          position =
            playerRef.current
              ?.getCurrentTime?.() ??
            currentTimeRef.current;

        } catch {
          // Keep current position.
        }


        jamPlay(
          Number(
            position
          ) || 0
        );

      }

    };


  // ==========================================================
  // YOUTUBE PAUSE
  // ==========================================================

  const handlePlayerPause =
    () => {

      setIsPlaying(
        false
      );


      isPlayingRef.current =
        false;


      stopProgressTracking();


      if (
        currentSongRef.current &&
        listeningStartedRef.current
      ) {

        const pausePosition =
          currentTimeRef.current;


        if (
          Math.abs(
            pausePosition -
            lastListeningPauseRef.current
          ) > 1
        ) {

          lastListeningPauseRef.current =
            pausePosition;


          sendListeningEvent(
            "pause",
            currentSongRef.current,
            pausePosition,
            durationRef.current
          );

        }

      }


      // ------------------------------------------------------
      // JAM HOST
      // ------------------------------------------------------

      if (
        jamConnected &&
        isHost
      ) {

        /*
         * A pause generated by Jam must NOT
         * be sent back into Jam.
         */

        if (
          pendingJamPause.current
        ) {

          pendingJamPause.current =
            false;


          applyingJamEvent.current =
            false;


          return;

        }


        /*
         * A playback event caused by an incoming
         * Jam operation must never be rebroadcast.
         */

        if (
          applyingJamEvent.current
        ) {

          applyingJamEvent.current =
            false;


          return;

        }


        let position =
          currentTimeRef.current;


        try {

          position =
            playerRef.current
              ?.getCurrentTime?.() ??
            currentTimeRef.current;

        } catch {
          // Keep current position.
        }


        jamPause(
          Number(
            position
          ) || 0
        );

      }

    };


  // ==========================================================
  // YOUTUBE END
  // ==========================================================

  const handlePlayerEnd =
    async () => {

      stopProgressTracking();


      if (
        currentSongRef.current
      ) {

        sendListeningEvent(
          "complete",
          currentSongRef.current,
          durationRef.current ||
            currentTimeRef.current,
          durationRef.current
        );

      }


      listeningStartedRef.current =
        false;


      lastListeningProgressRef.current =
        0;


      lastListeningPauseRef.current =
        0;


      setCurrentTime(
        0
      );


      currentTimeRef.current =
        0;


      setIsPlaying(
        false
      );


      isPlayingRef.current =
        false;


      /*
       * Guest never advances independently
       * inside a Jam.
       *
       * Host controls the queue.
       */

      if (
        jamConnected &&
        !isHost
      ) {

        return;

      }


      const actualCurrentIndex =
        queue.findIndex(
          (item) =>
            isSameSong(
              item,
              currentSongRef.current
            )
        );


      const baseIndex =
        actualCurrentIndex >= 0
          ? actualCurrentIndex
          : currentIndex;


      const nextIndex =
        baseIndex + 1;


      if (
        nextIndex <
        queue.length
      ) {

        await playSong(
          queue[nextIndex],
          queue
        );

      }

    };


  // ==========================================================
  // YOUTUBE ERROR
  // ==========================================================

  const handlePlayerError = (
    error
  ) => {

    console.error(
      "YouTube player error:",
      error?.data
    );


    youtubeReadyRef.current =
      false;


    setYoutubeReady(
      false
    );


    stopProgressTracking();


    setIsPlaying(
      false
    );


    isPlayingRef.current =
      false;


    setIsLoading(
      false
    );

  };


  // ==========================================================
  // TOGGLE PLAY
  // ==========================================================

  const togglePlay = () => {

    const activePlayer =
      playerRef.current;


    if (!activePlayer) {
      return;
    }


    try {

      const state =
        activePlayer.getPlayerState();


      /*
       * Playing.
       */

      if (
        state === 1
      ) {

        activePlayer.pauseVideo();

        return;

      }


      /*
       * Paused / unstarted / cued.
       */

      activePlayer.unMute();


      activePlayer.setVolume(
        volumeRef.current
      );


      activePlayer.playVideo();

    } catch (error) {

      console.error(
        "Playback control failed:",
        error
      );

    }

  };


  // ==========================================================
  // SEEK
  // ==========================================================

  const seekTo = (
    value,
    options = {}
  ) => {

    const activePlayer =
      playerRef.current;


    if (
      !activePlayer ||
      !durationRef.current
    ) {
      return;
    }


    const numericValue =
      Number(
        value
      );


    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return;
    }


    const time =
      Math.max(
        0,
        Math.min(
          numericValue,
          durationRef.current
        )
      );


    try {

      activePlayer.seekTo(
        time,
        true
      );


      setCurrentTime(
        time
      );


      currentTimeRef.current =
        time;


      /*
       * Only the host broadcasts seeks.
       */

      if (
        jamConnected &&
        isHost &&
        options.fromJam !== true
      ) {

        jamSeek(
          time
        );

      }

    } catch (error) {

      console.error(
        "Seek failed:",
        error
      );

    }

  };


  // ==========================================================
  // VOLUME
  // ==========================================================

  const changeVolume = (
    value
  ) => {

    const numericVolume =
      Number(
        value
      );


    if (
      !Number.isFinite(
        numericVolume
      )
    ) {
      return;
    }


    const newVolume =
      Math.max(
        0,
        Math.min(
          numericVolume,
          100
        )
      );


    setVolume(
      newVolume
    );


    volumeRef.current =
      newVolume;


    if (
      playerRef.current
    ) {

      try {

        playerRef.current.unMute();


        playerRef.current.setVolume(
          newVolume
        );

      } catch {
        // Ignore until ready.
      }

    }

  };


  // ==========================================================
  // STOP
  // ==========================================================

  const stopSong = () => {

    if (
      currentSongRef.current &&
      listeningStartedRef.current
    ) {

      sendListeningEvent(
        "pause",
        currentSongRef.current,
        currentTimeRef.current,
        durationRef.current
      );

    }


    listeningStartedRef.current =
      false;


    lastListeningProgressRef.current =
      0;


    lastListeningPauseRef.current =
      0;


    playRequestId.current += 1;


    pendingJamSong.current =
      null;


    pendingJamPlay.current =
      false;


    pendingJamPause.current =
      false;


    applyingJamEvent.current =
      false;


    if (
      playerRef.current
    ) {

      try {

        playerRef.current.stopVideo();

      } catch {
        // Ignore.
      }

    }


    stopProgressTracking();


    setYoutubeVideoId(
      null
    );


    setIsPlaying(
      false
    );


    isPlayingRef.current =
      false;


    setCurrentTime(
      0
    );


    currentTimeRef.current =
      0;


    setDuration(
      0
    );


    durationRef.current =
      0;


    setIsLoading(
      false
    );

  };


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <PlayerContext.Provider
      value={{

        currentSong,

        youtubeVideoId,

        youtubeBootstrapId,

        youtubeReady,


        primeSong,

        isSongReady,


        isPlaying,

        isLoading,


        player,

        currentTime,

        duration,

        volume,


        playSong,

        playNext,

        playPrevious,

        togglePlay,

        stopSong,


        seekTo,

        changeVolume,


        handlePlayerReady,

        handlePlayerPlay,

        handlePlayerPause,

        handlePlayerEnd,

        handlePlayerError,


        recentlyPlayed,


        queue,

        currentIndex,

        addToQueue,

        playNextSong,


        library,

        addToLibrary,

        removeFromLibrary,

        isInLibrary,


        favorites,

        addToFavorites,

        removeFromFavorites,

        isFavorite,


        playlists,

        createPlaylist,

        addToPlaylist,

        removeFromPlaylist,


        jamConnected,

        sessionId,

        isHost,

      }}
    >

      {children}

    </PlayerContext.Provider>

  );

}


// ============================================================
// HOOK
// ============================================================

export function usePlayer() {

  const context =
    useContext(
      PlayerContext
    );


  if (!context) {

    throw new Error(
      "usePlayer must be used inside PlayerProvider"
    );

  }


  return context;

}