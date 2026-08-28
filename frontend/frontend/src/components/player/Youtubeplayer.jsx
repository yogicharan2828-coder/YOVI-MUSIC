import YouTube from "react-youtube";

import {
  usePlayer,
} from "../../context/PlayerContext";


function YouTubePlayer({
  visible = false,
}) {

  const {
    youtubeBootstrapId,
    handlePlayerReady,
    handlePlayerPlay,
    handlePlayerPause,
    handlePlayerEnd,
    handlePlayerError,
  } = usePlayer();


  if (!youtubeBootstrapId) {
    return null;
  }


  return (

    <div
      className={
        visible
          ? "youtube-player-surface visible"
          : "youtube-player-surface"
      }
      aria-hidden="true"
    >

      <YouTube

        videoId={
          youtubeBootstrapId
        }

        opts={{

          width: "100%",
          height: "100%",

          playerVars: {

            autoplay: 0,

            controls: 0,

            disablekb: 1,

            fs: 0,

            playsinline: 1,

            rel: 0,

            modestbranding: 1,

            iv_load_policy: 3,

            cc_load_policy: 0,

            enablejsapi: 1,

            /*
             * Always use the actual YOVI
             * frontend origin.
             *
             * This works with localhost,
             * 127.0.0.1 and production.
             */
            origin:
              window.location.origin,

          },

        }}

        onReady={
          handlePlayerReady
        }

        onPlay={
          handlePlayerPlay
        }

        onPause={
          handlePlayerPause
        }

        onEnd={
          handlePlayerEnd
        }

        onError={
          handlePlayerError
        }

      />

    </div>

  );

}


export default YouTubePlayer;