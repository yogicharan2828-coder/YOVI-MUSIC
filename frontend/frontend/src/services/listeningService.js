import API_BASE_URL from "../config/api";


// ============================================================
// CONSTANTS
// ============================================================

const DEVICE_ID_KEY =
  "yovi_device_id";

const AUTH_TOKEN_KEY =
  "yovi_access_token";


// ============================================================
// DEVICE ID
// ============================================================

function getDeviceId() {

  try {

    let deviceId =
      localStorage.getItem(
        DEVICE_ID_KEY
      );


    if (!deviceId) {

      deviceId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"

          ? crypto.randomUUID()

          : `yovi-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;


      localStorage.setItem(
        DEVICE_ID_KEY,
        deviceId
      );

    }


    return deviceId;

  } catch {

    return null;

  }

}


// ============================================================
// AUTH TOKEN
// ============================================================

function getAuthToken() {

  try {

    return localStorage.getItem(
      AUTH_TOKEN_KEY
    );

  } catch {

    return null;

  }

}


// ============================================================
// RECORD LISTENING EVENT
// ============================================================

export async function recordListeningEvent({

  song,

  eventType,

  positionSeconds = 0,

  durationSeconds = 0,

}) {

  if (
    !song ||
    !eventType
  ) {

    return false;

  }


  const payload = {

    device_id:
      getDeviceId(),

    event_type:
      eventType,

    song_id:
      song.song_id ??
      null,

    external_id:
      song.id != null
        ? String(song.id)
        : null,

    external_source:
      song.provider ??
      song.external_source ??
      "unknown",

    image:
      song.image ??
      song.cover_url ??
      song.coverUrl ??
      song.thumbnail ??
      song.thumbnailUrl ??
      null,

    cover_url:
      song.cover_url ??
      song.coverUrl ??
      song.image ??
      song.thumbnail ??
      song.thumbnailUrl ??
      null,

    title:
      song.title ??
      "",

    artist:
      song.artist ??
      null,

    album:
      song.album ??
      null,

    language:
      song.language ??
      null,

    genre:
      song.genre ??
      null,

    mood:
      song.mood ??
      null,

    position_seconds:
      Number.isFinite(
        Number(
          positionSeconds
        )
      )
        ? Math.round(
            Number(
              positionSeconds
            )
          )
        : 0,

    duration_seconds:
      Number.isFinite(
        Number(
          durationSeconds
        )
      )
        ? Math.round(
            Number(
              durationSeconds
            )
          )
        : 0,

  };


  try {

    const token =
      getAuthToken();


    const headers = {

      "Content-Type":
        "application/json",

    };


    /*
     * If the user is logged in, send the JWT.
     *
     * The backend uses this token to associate
     * the listening event with current_user.id.
     *
     * Anonymous users simply don't get this header.
     */

    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }


    const response =
      await fetch(

        `${API_BASE_URL}/listening/events`,

        {

          method:
            "POST",

          headers,

          body:
            JSON.stringify(
              payload
            ),

        }

      );


    if (
      !response.ok
    ) {

      const errorText =
        await response.text()
          .catch(
            () => ""
          );


      console.warn(
        "YOVI listening event rejected:",
        response.status,
        errorText
      );


      return false;

    }


    return true;

  } catch (error) {

    /*
     * Analytics must NEVER interrupt playback.
     */

    console.warn(
      "YOVI listening event failed:",
      error
    );


    return false;

  }

}


// ============================================================
// LISTENING HISTORY
// ============================================================

export async function getListeningHistory(
  limit = 50
) {

  const token =
    getAuthToken();


  /*
   * Listening history is an authenticated endpoint.
   */

  if (!token) {

    return [];

  }


  try {

    const response =
      await fetch(

        `${API_BASE_URL}/listening/history?limit=${limit}`,

        {

          method:
            "GET",

          headers: {

            Authorization:
              `Bearer ${token}`,

          },

        }

      );


    if (
      response.status ===
      401
    ) {

      return [];

    }


    if (
      !response.ok
    ) {

      const errorText =
        await response.text()
          .catch(
            () => ""
          );


      console.warn(
        "YOVI listening history rejected:",
        response.status,
        errorText
      );


      return [];

    }


    const data =
      await response.json();


    return Array.isArray(
      data?.results
    )
      ? data.results
      : [];

  } catch (error) {

    /*
     * History loading must never break
     * the music player.
     */

    console.warn(
      "YOVI listening history failed:",
      error
    );


    return [];

  }

}


// ============================================================
// DEVICE ID
// ============================================================

export function getListeningDeviceId() {

  return getDeviceId();

}