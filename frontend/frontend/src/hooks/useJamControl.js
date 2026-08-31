import { usePlayer } from "../context/PlayerContext";


function useJamControl() {

  const {
    jamConnected,
    isHost,
  } = usePlayer();


  console.log(
    "[YOVI JAM CONTROL]",
    {
      jamConnected,
      isHost,
      canPlayPause:
        !jamConnected || isHost,
      canSeek:
        !jamConnected || isHost,
      canSkip:
        !jamConnected || isHost,
    }
  );


  if (!jamConnected) {

    return {
      canPlayPause: true,
      canSeek: true,
      canSkip: true,
      isJamGuest: false,
    };

  }


  if (isHost) {

    return {
      canPlayPause: true,
      canSeek: true,
      canSkip: true,
      isJamGuest: false,
    };

  }


  return {
    canPlayPause: false,
    canSeek: false,
    canSkip: false,
    isJamGuest: true,
  };

}


export default useJamControl;