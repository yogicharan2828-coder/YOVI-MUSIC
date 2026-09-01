import { usePlayer } from "../context/PlayerContext";
import { useJam } from "../context/JamContext";


function useJamControl() {

  const {
    jamConnected,
    isHost,
  } = usePlayer();


  const {
    jamState,
  } = useJam();


  const allowGuestPlayback =
    Boolean(
      jamState?.allowGuestPlayback ??
      jamState?.allow_guest_playback ??
      false
    );


  const allowGuestSongChange =
    Boolean(
      jamState?.allowGuestSongChange ??
      jamState?.allow_guest_song_change ??
      false
    );


  const allowGuestQueue =
    Boolean(
      jamState?.allowGuestQueue ??
      jamState?.allow_guest_queue ??
      false
    );


  // ==========================================================
  // NORMAL MUSIC PLAYER
  // ==========================================================

  if (!jamConnected) {

    return {

      canPlayPause: true,

      canSeek: true,

      canSkip: true,

      canAddToJamQueue: false,

      canAddToJamPlaylist: false,

      isJamGuest: false,

    };

  }


  // ==========================================================
  // HOST
  // ==========================================================

  if (isHost) {

    return {

      canPlayPause: true,

      canSeek: true,

      canSkip: true,

      canAddToJamQueue: true,

      canAddToJamPlaylist: true,

      isJamGuest: false,

    };

  }


  // ==========================================================
  // GUEST
  // ==========================================================

  return {

    canPlayPause:
      allowGuestPlayback,

    canSeek:
      false,

    canSkip:
      allowGuestSongChange,

    canAddToJamQueue:
      allowGuestQueue,

    canAddToJamPlaylist:
      allowGuestQueue,

    isJamGuest: true,

  };

}


export default useJamControl;