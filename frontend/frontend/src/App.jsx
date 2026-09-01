import {
  Routes,
  Route,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Navbar from "./components/layout/Navbar";
import Explore from "./pages/Explore";

import Hero from "./components/home/Hero";
import MusicSection from "./components/home/MusicSection";
import SpotlightCard from "./components/home/SpotlightCard";

import MusicPlayer from "./components/player/Musicplayer";
import YouTubePlayer from "./components/player/Youtubeplayer";
import AudioPlayer
  from "./components/player/AudioPlayer";

import Search from "./pages/Search";
import Collections from "./pages/Collections";
import Login from "./pages/Login";
import Register from "./pages/Register";

import {
  recentlyPlayed as initialRecentlyPlayed,
  trendingWave,
  spotlight,
  curatedForYou,
} from "./data/mockMusic";

import {
  usePlayer,
} from "./context/PlayerContext";

import {
  useAuth,
} from "./context/AuthContext";

import AuthCallback from "./pages/AuthCallback";

import "./styles/globals.css";


// ============================================================
// HOME
// ============================================================

function Home() {

  const {
    recentlyPlayed,
  } = usePlayer();


const displayedRecentlyPlayed =
  recentlyPlayed;

  return (

    <main>

      {/* =====================================================
          HERO
      ===================================================== */}

      <Hero />


      <div className="music-content">


        {/* ===================================================
            RECENTLY REPLAYED
        =================================================== */}

        <MusicSection
          title="RECENTLY REPLAYED"
          songs={
            displayedRecentlyPlayed
          }
        />


        {/* ===================================================
            TRENDING WAVE
        =================================================== */}

        <MusicSection
          title="TRENDING WAVE"
          songs={
            trendingWave
          }
        />


        {/* ===================================================
            INDIAN SPOTLIGHT
        =================================================== */}

        <section className="spotlight-section">

          <div className="section-header">

            <h2>
              INDIAN SPOTLIGHT
            </h2>


            <button
              className="section-see-all"
            >
              SEE ALL
            </button>

          </div>


          <div className="spotlight-grid">

            {spotlight.map(
              (item) => (

                <SpotlightCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                />

              )
            )}

          </div>

        </section>


        {/* ===================================================
            CURATED
        =================================================== */}

        <MusicSection
          title="CURATED FOR YOU"
          songs={
            curatedForYou
          }
        />

      </div>

    </main>

  );

}


// ============================================================
// AUTH TOAST
// ============================================================

function AuthToast() {

  const {
    user,
    loading,
  } = useAuth();


  const previousUserRef =
    useRef(null);


  const hasLoadedOnceRef =
    useRef(false);


  const [
    toast,
    setToast,
  ] = useState(null);


  const toastTimerRef =
    useRef(null);


  // ==========================================================
  // AUTH STATE CHANGE
  // ==========================================================

  useEffect(() => {

    /*
     * Do not show a toast while the initial
     * authentication state is being restored.
     */

    if (loading) {

      return;

    }


    const previousUser =
      previousUserRef.current;


    const currentUser =
      user;


    // --------------------------------------------------------
    // INITIAL SESSION LOAD
    // --------------------------------------------------------

    if (!hasLoadedOnceRef.current) {

      hasLoadedOnceRef.current =
        true;


      previousUserRef.current =
        currentUser;


      return;

    }


    // --------------------------------------------------------
    // LOGIN
    // --------------------------------------------------------

    if (
      !previousUser &&
      currentUser
    ) {

      const name =
        currentUser.display_name ||
        currentUser.username ||
        "YOVI";


      setToast({

        type:
          "success",

        message:
          `Welcome back, ${name}!`,

      });

    }


    // --------------------------------------------------------
    // LOGOUT
    // --------------------------------------------------------

    if (
      previousUser &&
      !currentUser
    ) {

      setToast({

        type:
          "logout",

        message:
          "Successfully logged out.",

      });

    }


    previousUserRef.current =
      currentUser;


  }, [
    user,
    loading,
  ]);


  // ==========================================================
  // AUTO DISMISS
  // ==========================================================

  useEffect(() => {

    if (!toast) {

      return;

    }


    clearTimeout(
      toastTimerRef.current
    );


    toastTimerRef.current =
      window.setTimeout(
        () => {

          setToast(
            null
          );

        },
        2600
      );


    return () => {

      clearTimeout(
        toastTimerRef.current
      );

    };

  }, [
    toast,
  ]);


  if (!toast) {

    return null;

  }


  return (

    <div
      className={`yovi-auth-toast ${
        toast.type === "logout"
          ? "logout"
          : ""
      }`}
      role="status"
    >

      <span className="yovi-auth-toast-mark">

        {
          toast.type === "logout"
            ? "✓"
            : "Y"
        }

      </span>


      <span className="yovi-auth-toast-message">

        {toast.message}

      </span>


      <button
        type="button"
        className="yovi-auth-toast-close"
        onClick={() =>
          setToast(null)
        }
        aria-label="Close notification"
      >

        ×

      </button>

    </div>

  );

}


// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {

  const [
    jamOpen,
    setJamOpen,
  ] = useState(false);


  const [
    nowPlayingOpen,
    setNowPlayingOpen,
  ] = useState(false);


  return (

    <div className="yovi-app">


      {/* ==================================================
          GLOBAL NAVBAR
      ================================================== */}

      <Navbar

        jamOpen={
          jamOpen
        }

        onJamOpen={() =>
          setJamOpen(
            true
          )
        }

        onJamClose={() =>
          setJamOpen(
            false
          )
        }

      />


      {/* ==================================================
          ROUTES
      ================================================== */}

      <Routes>


        {/* ==================================================
            HOME
        ================================================== */}

        <Route
          path="/"
          element={
            <Home />
          }
        />


        {/* ==================================================
            SEARCH
        ================================================== */}

        <Route
          path="/search"
          element={
            <Search />
          }
        />


        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* ==================================================
            REGISTER
        ================================================== */}

        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* ==================================================
            EXPLORE
        ================================================== */}

        <Route
          path="/explore"
          element={
            <Explore />
          }
        />


        {/* ==================================================
            GOOGLE AUTH CALLBACK
        ================================================== */}

        <Route
          path="/auth/callback"
          element={
            <AuthCallback />
          }
        />


        {/* ==================================================
            COLLECTIONS
        ================================================== */}

        <Route
          path="/collections"
          element={
            <Collections />
          }
        />

      </Routes>


      {/* ==================================================
          GLOBAL MUSIC PLAYER
      ================================================== */}

      <MusicPlayer

        onJam={() =>
          setJamOpen(
            true
          )
        }

        onNowPlayingChange={
          setNowPlayingOpen
        }

      />


      {/* ==================================================
          GLOBAL YOUTUBE PLAYBACK
      ================================================== */}

      <YouTubePlayer

        visible={
          nowPlayingOpen
        }

      />
<AudioPlayer />

      {/* ==================================================
          AUTH TOAST
      ================================================== */}

      <AuthToast />

    </div>

  );

}


// ============================================================
// APP
// ============================================================

function App() {

  return (
    <AppContent />
  );

}


export default App;