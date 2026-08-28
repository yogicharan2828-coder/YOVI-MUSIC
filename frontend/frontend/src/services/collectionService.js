import {
  authFetch,
} from "./authService";


// ============================================================
// API
// ============================================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// RESPONSE HELPER
// ============================================================

async function parseResponse(
  response,
  fallbackMessage
) {

  const data =
    await response.json()
      .catch(
        () => null
      );


  if (!response.ok) {

    throw new Error(
      data?.detail ||
      fallbackMessage
    );

  }


  return data;

}


// ============================================================
// LIBRARY
// ============================================================

export async function getLibrary() {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/library`,
      {
        method: "GET",
      }
    );


  return parseResponse(
    response,
    "Unable to load your library."
  );

}


export async function addSongToLibrary(
  song
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/library`,
      {

        method: "POST",

        body: JSON.stringify(
          normalizeSong(song)
        ),

      }
    );


  return parseResponse(
    response,
    "Unable to add song to library."
  );

}


export async function removeSongFromLibrary(
  itemId
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/library/${itemId}`,
      {
        method: "DELETE",
      }
    );


  if (
    response.status === 204
  ) {

    return true;

  }


  await parseResponse(
    response,
    "Unable to remove song from library."
  );


  return true;

}


// ============================================================
// FAVORITES
// ============================================================

export async function getFavorites() {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/favorites`,
      {
        method: "GET",
      }
    );


  return parseResponse(
    response,
    "Unable to load your favorites."
  );

}


export async function addSongToFavorites(
  song
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/favorites`,
      {

        method: "POST",

        body: JSON.stringify(
          normalizeSong(song)
        ),

      }
    );


  return parseResponse(
    response,
    "Unable to add song to favorites."
  );

}


export async function removeSongFromFavorites(
  itemId
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/favorites/${itemId}`,
      {
        method: "DELETE",
      }
    );


  if (
    response.status === 204
  ) {

    return true;

  }


  await parseResponse(
    response,
    "Unable to remove song from favorites."
  );


  return true;

}


// ============================================================
// PLAYLISTS
// ============================================================

export async function getPlaylists() {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/playlists/all`,
      {
        method: "GET",
      }
    );


  return parseResponse(
    response,
    "Unable to load your playlists."
  );

}


export async function createPlaylist(
  name
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/playlists`,
      {

        method: "POST",

        body: JSON.stringify({
          name:
            name.trim(),
        }),

      }
    );


  return parseResponse(
    response,
    "Unable to create playlist."
  );

}


export async function deletePlaylist(
  playlistId
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/playlists/${playlistId}`,
      {
        method: "DELETE",
      }
    );


  if (
    response.status === 204
  ) {

    return true;

  }


  await parseResponse(
    response,
    "Unable to delete playlist."
  );


  return true;

}


// ============================================================
// PLAYLIST SONGS
// ============================================================

export async function addSongToPlaylist(
  playlistId,
  song
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/playlists/${playlistId}/songs`,
      {

        method: "POST",

        body: JSON.stringify(
          normalizeSong(song)
        ),

      }
    );


  return parseResponse(
    response,
    "Unable to add song to playlist."
  );

}


export async function removeSongFromPlaylist(
  playlistId,
  itemId
) {

  const response =
    await authFetch(
      `${API_BASE_URL}/collections/playlists/${playlistId}/songs/${itemId}`,
      {
        method: "DELETE",
      }
    );


  if (
    response.status === 204
  ) {

    return true;

  }


  await parseResponse(
    response,
    "Unable to remove song from playlist."
  );


  return true;

}


// ============================================================
// SONG NORMALIZER
// ============================================================

function normalizeSong(
  song
) {

  if (!song) {

    return {};

  }


  return {

    external_id:
      song.external_id ??
      song.externalId ??
      song.id ??
      null,

    external_source:
      song.external_source ??
      song.externalSource ??
      "yovi",

    title:
      song.title ??
      "",

    artist:
      song.artist ??
      song.artist_name ??
      song.artistName ??
      null,

    album:
      song.album ??
      song.album_name ??
      song.albumName ??
      null,

    image:
      song.image ??
      null,

    cover_url:
      song.cover_url ??
      song.coverUrl ??
      song.image ??
      null,

    video_id:
      song.video_id ??
      song.videoId ??
      song.youtubeId ??
      song.youtube_id ??
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

  };

}