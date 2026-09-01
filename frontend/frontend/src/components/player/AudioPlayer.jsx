import {
  useEffect,
  useRef,
} from "react";

import {
  usePlayer,
} from "../../context/PlayerContext";


function AudioPlayer() {

  const {
    currentSong,
    volume,

    handleAudioReady,

    handleAudioPlay,
    handleAudioPause,
    handleAudioEnded,
    handleAudioTimeUpdate,
    handleAudioLoadedMetadata,
    handleAudioError,
  } = usePlayer();


  const audioRef =
    useRef(null);


  // ==========================================================
  // REGISTER AUDIO ELEMENT
  // ==========================================================

  useEffect(() => {

    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    handleAudioReady(
      audio
    );


    return () => {

      handleAudioReady(
        null
      );

    };

  }, [
    handleAudioReady,
  ]);


  // ==========================================================
  // VOLUME
  // ==========================================================

  useEffect(() => {

    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const nextVolume =
      Number(volume);

    if (
      !Number.isFinite(
        nextVolume
      )
    ) {
      return;
    }

    audio.volume =
      Math.max(
        0,
        Math.min(
          1,
          nextVolume / 100
        )
      );

  }, [
    volume,
  ]);


  // ==========================================================
  // SOURCE
  // ==========================================================

  useEffect(() => {

    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }


    if (
      !currentSong ||
      currentSong.provider !==
        "jiosaavn"
    ) {

      audio.pause();

      audio.removeAttribute(
        "src"
      );

      audio.load();

      return;

    }


    /*
     * For now we use the provider's
     * preview URL to validate the
     * native audio pipeline.
     *
     * Do NOT substitute encrypted/
     * protected JioSaavn media fields.
     */

    const source =
      currentSong.preview_url;


    if (!source) {

      audio.pause();

      audio.removeAttribute(
        "src"
      );

      audio.load();

      return;

    }


    if (
      audio.src !==
      source
    ) {

      audio.src =
        source;

      audio.load();

    }

  }, [
    currentSong,
  ]);


  // ==========================================================
  // AUDIO ELEMENT
  // ==========================================================

  return (

    <audio
      ref={audioRef}

      preload="auto"

      playsInline

      onPlay={
        handleAudioPlay
      }

      onPause={
        handleAudioPause
      }

      onEnded={
        handleAudioEnded
      }

      onTimeUpdate={(event) => {

        handleAudioTimeUpdate(
          event.currentTarget.currentTime
        );

      }}

      onLoadedMetadata={(event) => {

        handleAudioLoadedMetadata(
          event.currentTarget.duration
        );

      }}

      onError={(event) => {

        handleAudioError(
          event
        );

      }}

    />

  );

}


export default AudioPlayer;