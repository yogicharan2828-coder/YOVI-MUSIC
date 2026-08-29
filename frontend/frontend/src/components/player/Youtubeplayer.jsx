import YouTube from "react-youtube";

import {
  usePlayer,
} from "../../context/PlayerContext";


function YouTubePlayer({
  visible = false,
}) {

  const {
    youtubeBootstrapId,
    jamConnected,
    handlePlayerReady,
    handlePlayerPlay,
    handlePlayerPause,
    handlePlayerEnd,
    handlePlayerError,
  } = usePlayer();


  if (!youtubeBootstrapId) {
    return null;
  }


  const audioOnly =
    Boolean(jamConnected);


  return (

    <div
      className={
        audioOnly
          ? "youtube-player-surface jam-audio-only"
          : visible
            ? "youtube-player-surface visible"
            : "youtube-player-surface"
      }
      aria-hidden="true"
      style={
        audioOnly
          ? {
              position: "absolute",
              width: "1px",
              height: "1px",
              minWidth: "1px",
              minHeight: "1px",
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
              left: "-9999px",
              top: "0",
            }
          : undefined
      }
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
