import {
  Compass,
  Dumbbell,
  Flame,
  Globe2,
  Heart,
  Languages,
  Moon,
  PartyPopper,
  Sparkles,
  Target,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import MusicSection from "../components/home/MusicSection";

import {
  curatedForYou,
} from "../data/mockMusic";

import {
  usePlayer,
} from "../context/PlayerContext";

import {
  getListeningDeviceId,
} from "../services/listeningService";

import {
  getDeviceExplore,
} from "../services/exploreService";


// ============================================================
// FRONTEND EXPLORE CACHE
// ============================================================

const EXPLORE_STORAGE_KEY =
  "yovi_explore_data_v1";


// ============================================================
// READ FRONTEND CACHE
// ============================================================

function readExploreCache() {

  try {

    const stored =
      sessionStorage.getItem(
        EXPLORE_STORAGE_KEY
      );


    if (!stored) {

      return null;

    }


    const parsed =
      JSON.parse(
        stored
      );


    if (
      parsed &&
      typeof parsed === "object"
    ) {

      return parsed;

    }

  } catch (error) {

    console.warn(
      "YOVI Explore cache read failed:",
      error
    );

  }


  return null;

}


// ============================================================
// WRITE FRONTEND CACHE
// ============================================================

function writeExploreCache(
  data
) {

  if (!data) {

    return;

  }


  try {

    sessionStorage.setItem(
      EXPLORE_STORAGE_KEY,
      JSON.stringify(data)
    );

  } catch (error) {

    console.warn(
      "YOVI Explore cache write failed:",
      error
    );

  }

}


// ============================================================
// STATIC CARD INFORMATION
// ============================================================

const languageInfo = {

  telugu: {
    name: "Telugu",
    description:
      "Melodies, mass hits and timeless favorites.",
    icon: "తె",
  },

  hindi: {
    name: "Hindi",
    description:
      "Bollywood, indie and Hindi favorites.",
    icon: "हि",
  },

  tamil: {
    name: "Tamil",
    description:
      "Tamil cinema and independent sounds.",
    icon: "த",
  },

  kannada: {
    name: "Kannada",
    description:
      "New-age and classic Kannada music.",
    icon: "ಕ",
  },

  malayalam: {
    name: "Malayalam",
    description:
      "Beautiful sounds from Malayalam cinema.",
    icon: "മ",
  },

  english: {
    name: "English",
    description:
      "Global pop, indie and alternative.",
    icon: "EN",
  },

};


const activityInfo = {

  gym: {
    title: "GYM",
    description:
      "High-energy tracks for your workout.",
    icon: Dumbbell,
  },

  focus: {
    title: "FOCUS",
    description:
      "Music for deep work and concentration.",
    icon: Target,
  },

  chill: {
    title: "CHILL",
    description:
      "Slow down with relaxed sounds.",
    icon: Moon,
  },

  party: {
    title: "PARTY",
    description:
      "Turn the energy all the way up.",
    icon: PartyPopper,
  },

  romantic: {
    title: "ROMANTIC",
    description:
      "Songs made for the moment.",
    icon: Heart,
  },

  travel: {
    title: "TRAVEL",
    description:
      "Soundtracks for the road ahead.",
    icon: Globe2,
  },

};


// ============================================================
// LANGUAGE CARD
// ============================================================

function LanguageCard({
  language,
}) {

  const info =
    languageInfo[
      String(
        language.id
      ).toLowerCase()
    ] || {

      name:
        language.name ||
        language.id,

      description:
        "Explore music in this language.",

      icon:
        language.name?.slice(
          0,
          2
        ) || "♪",

    };


  return (

    <button
      type="button"
      className="explore-language-card"
    >

      <span className="explore-language-symbol">
        {info.icon}
      </span>

      <span className="explore-language-content">

        <strong>
          {info.name}
        </strong>

        <small>
          {info.description}
        </small>

      </span>

    </button>

  );

}


// ============================================================
// ACTIVITY CARD
// ============================================================

function ActivityCard({
  activity,
}) {

  const info =
    activityInfo[
      String(
        activity.id
      ).toLowerCase()
    ] || {};


  const Icon =
    info.icon ||
    Target;


  return (

    <button
      type="button"
      className="explore-activity-card"
    >

      <span className="explore-activity-icon">

        <Icon
          size={22}
          strokeWidth={1.5}
        />

      </span>

      <span>

        <strong>
          {info.title ||
            activity.title ||
            activity.name}
        </strong>

        <small>
          {info.description ||
            "Music for the moment."}
        </small>

      </span>

    </button>

  );

}


// ============================================================
// EXPLORE
// ============================================================

function Explore() {

  const {
    recentlyPlayed: playerRecentlyPlayed,
  } = usePlayer();


  // ==========================================================
  // INITIAL FRONTEND CACHE
  // ==========================================================

  const initialCache =
    useRef(
      readExploreCache()
    );


  // ==========================================================
  // EXPLORE DATA
  // ==========================================================

  const [
    exploreData,
    setExploreData,
  ] = useState(
    initialCache.current
  );


  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    exploreLoading,
    setExploreLoading,
  ] = useState(
    !initialCache.current
  );


  // ==========================================================
  // REQUEST LOCK
  // ==========================================================

  const requestInFlightRef =
    useRef(false);


  // ==========================================================
  // LAST LOADED BEHAVIOR COUNT
  // ==========================================================
  //
  // We intentionally DO NOT refresh Explore for every song.
  //
  // The backend itself decides when Made For You should
  // change after the configured behaviour threshold.
  //
  // Therefore PlayerContext changes should not trigger
  // another Explore request here.
  // ==========================================================

  const previousRecentCountRef =
    useRef(
      playerRecentlyPlayed.length
    );


  // Keep React aware of the value without using it to
  // trigger Explore regeneration.
  useEffect(() => {

    previousRecentCountRef.current =
      playerRecentlyPlayed.length;

  }, [
    playerRecentlyPlayed.length,
  ]);


  // ==========================================================
  // LOAD EXPLORE
  // ==========================================================

  const loadExplore =
    useCallback(
      async (
        showLoading = false
      ) => {

        // ----------------------------------------------------
        // Prevent duplicate requests.
        // ----------------------------------------------------

        if (
          requestInFlightRef.current
        ) {

          return;

        }


        const existingCache =
          readExploreCache();


        // ----------------------------------------------------
        // If we already have Explore data,
        // never show a loading screen.
        // ----------------------------------------------------

        if (
          existingCache &&
          !exploreData
        ) {

          setExploreData(
            existingCache
          );

        }


        if (
          showLoading &&
          !existingCache
        ) {

          setExploreLoading(
            true
          );

        }


        requestInFlightRef.current =
          true;


        try {

          const deviceId =
            getListeningDeviceId();


          // --------------------------------------------------
          // No device identity.
          // --------------------------------------------------

          if (!deviceId) {

            /*
             * If cached data exists, keep showing it.
             * Never destroy the existing Explore screen.
             */

            if (
              !existingCache &&
              !exploreData
            ) {

              setExploreData(
                null
              );

            }

            return;

          }


          // --------------------------------------------------
          // Backend request.
          // --------------------------------------------------

          const data =
            await getDeviceExplore(
              deviceId
            );


          // --------------------------------------------------
          // Valid response.
          // --------------------------------------------------

          if (
            data &&
            typeof data === "object"
          ) {

            setExploreData(
              data
            );


            writeExploreCache(
              data
            );

          }

        } catch (error) {

          console.warn(
            "YOVI Explore loading failed:",
            error
          );

          /*
           * Existing Explore data remains visible.
           */

        } finally {

          requestInFlightRef.current =
            false;

          setExploreLoading(
            false
          );

        }

      },
      [
        exploreData,
      ]
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    /*
     * If Explore already exists in frontend cache,
     * DO NOT request the backend again just because
     * the component mounted.
     */

    if (
      initialCache.current
    ) {

      return;

    }


    loadExplore(
      true
    );

  }, [
    loadExplore,
  ]);


  // ==========================================================
  // EXTRACT BACKEND DATA
  // ==========================================================

  const madeForYou =
    Array.isArray(
      exploreData
        ?.made_for_you
        ?.results
    )
      ? exploreData.made_for_you.results
      : [];


  const backendLanguages =
    exploreData?.languages &&
    typeof exploreData.languages === "object"
      ? exploreData.languages
      : {};


  const backendMoods =
    exploreData?.moods &&
    typeof exploreData.moods === "object"
      ? exploreData.moods
      : {};


  const backendActivities =
    exploreData?.activities &&
    typeof exploreData.activities === "object"
      ? exploreData.activities
      : {};


  const trending =
    Array.isArray(
      exploreData?.trending
    )
      ? exploreData.trending
      : [];


  const discover =
    Array.isArray(
      exploreData?.discover
    )
      ? exploreData.discover
      : [];


  // ==========================================================
  // LANGUAGE CARDS
  // ==========================================================

  const languages =
    Object.keys(
      backendLanguages
    ).map(
      (id) => ({

        id,

        name:
          languageInfo[
            id.toLowerCase()
          ]?.name ||
          id,

      })
    );


  // ==========================================================
  // ACTIVITY CARDS
  // ==========================================================

  const activities =
    Object.keys(
      backendActivities
    ).map(
      (id) => ({

        id,

        title:
          activityInfo[
            id.toLowerCase()
          ]?.title ||
          id,

      })
    );


  // ==========================================================
  // PERSONALIZATION
  // ==========================================================

  const recommendationMode =
    exploreData
      ?.made_for_you
      ?.mode ||
    "discovery";


  const personalizedNote =
    madeForYou.length > 0

      ? recommendationMode ===
        "personalized"

        ? "Based on your listening"

        : recommendationMode ===
          "learning"

          ? "Learning your taste"

          : "Discovering for you"

      : "Start listening to personalize YOVI";


  // ==========================================================
  // INITIAL LOADING
  // ==========================================================

  if (
    exploreLoading &&
    !exploreData
  ) {

    return (

      <main className="explore-page">

        <section className="explore-header">

          <div>

            <span className="explore-eyebrow">
              YOVI EXPLORE
            </span>

            <h1>
              Discover your next sound.
            </h1>

            <p>
              Explore music by language,
              mood, activity, artists and culture.
            </p>

          </div>


          <div className="explore-header-mark">

            <Compass
              size={54}
              strokeWidth={1}
            />

          </div>

        </section>


        <section className="explore-section">

          <div className="explore-loading-state">

            <span>
              Building your Explore experience...
            </span>

          </div>

        </section>

      </main>

    );

  }


  return (

    <main className="explore-page">


      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="explore-header">

        <div>

          <span className="explore-eyebrow">
            YOVI EXPLORE
          </span>

          <h1>
            Discover your next sound.
          </h1>

          <p>
            Explore music by language,
            mood, activity, artists and culture.
          </p>

        </div>


        <div className="explore-header-mark">

          <Compass
            size={54}
            strokeWidth={1}
          />

        </div>

      </section>


      {/* ====================================================
          MADE FOR YOU
      ==================================================== */}

      <section className="explore-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              PERSONALIZED
            </span>

            <h2>
              MADE FOR YOU
            </h2>

          </div>

          <span className="explore-section-note">
            {personalizedNote}
          </span>

        </div>


        {madeForYou.length > 0 ? (

          <MusicSection
            title=""
            songs={
              madeForYou
            }
          />

        ) : (

          <div className="explore-loading-state">

            <span>
              Start listening to personalize YOVI.
            </span>

          </div>

        )}

      </section>


      {/* ====================================================
          LANGUAGES
      ==================================================== */}

      <section className="explore-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              DISCOVER
            </span>

            <h2>
              SONGS BY LANGUAGE
            </h2>

          </div>

          <Languages
            size={22}
            strokeWidth={1.4}
          />

        </div>


        <div className="explore-language-grid">

          {languages.map(
            (language) => (

              <LanguageCard
                key={
                  language.id
                }
                language={
                  language
                }
              />

            )
          )}

        </div>


        {Object.entries(
          backendLanguages
        ).map(
          ([
            language,
            songs,
          ]) => {

            if (
              !Array.isArray(
                songs
              ) ||
              songs.length === 0
            ) {

              return null;

            }


            return (

              <div
                key={
                  language
                }
                className="explore-dynamic-subsection"
              >

                <div className="explore-section-heading">

                  <div>

                    <span className="explore-section-eyebrow">
                      {language}
                    </span>

                    <h2>
                      {String(
                        language
                      ).toUpperCase()}
                      {" "}FOR YOU
                    </h2>

                  </div>

                </div>


                <MusicSection
                  title=""
                  songs={
                    songs
                  }
                />

              </div>

            );

          }
        )}

      </section>


      {/* ====================================================
          MOODS
      ==================================================== */}

      <section className="explore-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              MUSIC FOR EVERY FEELING
            </span>

            <h2>
              MOODS
            </h2>

          </div>

          <Heart
            size={22}
            strokeWidth={1.4}
          />

        </div>


        {Object.entries(
          backendMoods
        ).map(
          ([
            mood,
            songs,
          ]) => {

            if (
              !Array.isArray(
                songs
              ) ||
              songs.length === 0
            ) {

              return null;

            }


            return (

              <div
                key={
                  mood
                }
                className="explore-dynamic-subsection"
              >

                <div className="explore-section-heading">

                  <div>

                    <span className="explore-section-eyebrow">
                      MOOD
                    </span>

                    <h2>
                      {String(
                        mood
                      ).toUpperCase()}
                    </h2>

                  </div>

                </div>


                <MusicSection
                  title=""
                  songs={
                    songs
                  }
                />

              </div>

            );

          }
        )}

      </section>


      {/* ====================================================
          ACTIVITIES
      ==================================================== */}

      <section className="explore-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              MUSIC FOR EVERY MOMENT
            </span>

            <h2>
              ACTIVITIES
            </h2>

          </div>

        </div>


        <div className="explore-activity-grid">

          {activities.map(
            (activity) => (

              <ActivityCard
                key={
                  activity.id
                }
                activity={
                  activity
                }
              />

            )
          )}

        </div>


        {Object.entries(
          backendActivities
        ).map(
          ([
            activity,
            songs,
          ]) => {

            if (
              !Array.isArray(
                songs
              ) ||
              songs.length === 0
            ) {

              return null;

            }


            return (

              <div
                key={
                  activity
                }
                className="explore-dynamic-subsection"
              >

                <div className="explore-section-heading">

                  <div>

                    <span className="explore-section-eyebrow">
                      ACTIVITY
                    </span>

                    <h2>
                      {String(
                        activity
                      ).toUpperCase()}
                    </h2>

                  </div>

                </div>


                <MusicSection
                  title=""
                  songs={
                    songs
                  }
                />

              </div>

            );

          }
        )}

      </section>


      {/* ====================================================
          TRENDING
      ==================================================== */}

      <section className="explore-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              RIGHT NOW
            </span>

            <h2>
              TRENDING NOW
            </h2>

          </div>

          <Flame
            size={22}
            strokeWidth={1.4}
          />

        </div>


        {trending.length > 0 ? (

          <MusicSection
            title=""
            songs={
              trending
            }
          />

        ) : (

          <div className="explore-loading-state">

            <span>
              Trending music is unavailable right now.
            </span>

          </div>

        )}

      </section>


      {/* ====================================================
          DISCOVER
      ==================================================== */}

      <section className="explore-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              GO DEEPER
            </span>

            <h2>
              DISCOVER
            </h2>

          </div>

          <Sparkles
            size={22}
            strokeWidth={1.4}
          />

        </div>


        {discover.length > 0 ? (

          <MusicSection
            title=""
            songs={
              discover
            }
          />

        ) : (

          <div className="explore-loading-state">

            <span>
              Discover something new.
            </span>

          </div>

        )}

      </section>


      {/* ====================================================
          CURATED
      ==================================================== */}

      <section className="explore-section explore-last-section">

        <div className="explore-section-heading">

          <div>

            <span className="explore-section-eyebrow">
              YOVI COLLECTION
            </span>

            <h2>
              CURATED FOR YOU
            </h2>

          </div>

        </div>


        <MusicSection
          title=""
          songs={
            curatedForYou
          }
        />

      </section>


    </main>

  );

}


export default Explore;