import asyncio
import json
from urllib.parse import quote

import httpx

from app.core.api_cache import api_cache
from app.services.music.base import MusicProvider


class JioSaavnService(MusicProvider):

    # ========================================================
    # DIRECT JIOSAAVN API
    # ========================================================

    BASE_URL = "https://www.jiosaavn.com/api.php"

    SEARCH_TTL = 60 * 60
    LOOKUP_TTL = 24 * 60 * 60

    REQUEST_TIMEOUT = 10.0
    MAX_RETRIES = 1

    # ========================================================
    # HTTP REQUEST
    # ========================================================

    async def _request(
        self,
        params: dict,
        ttl: int,
    ) -> dict | None:

        normalized_params = tuple(
            sorted(
                (
                    str(key),
                    str(value),
                )
                for key, value in params.items()
            )
        )

        cache_key = (
            f"jiosaavn:{normalized_params}"
        )

        cached = api_cache.get(cache_key)

        if cached is not None:
            print("[API CACHE HIT] JioSaavn")
            return cached

        print("[API CACHE MISS] JioSaavn")

        for attempt in range(self.MAX_RETRIES + 1):

            try:
                async with httpx.AsyncClient(
                    timeout=self.REQUEST_TIMEOUT,
                    follow_redirects=True,
                ) as client:

                    response = await client.get(
                        self.BASE_URL,
                        params=params,
                    )

                    response.raise_for_status()

                    data = response.json()

                if not isinstance(data, dict):
                    print(
                        "[JioSaavn] Invalid response format."
                    )
                    return None

                api_cache.set(
                    cache_key,
                    data,
                    ttl,
                )

                print(
                    "[JioSaavn] Request succeeded "
                    f"on attempt {attempt + 1}."
                )

                return data

            except (
                httpx.TimeoutException,
                httpx.ConnectError,
                httpx.NetworkError,
                httpx.RemoteProtocolError,
                httpx.HTTPStatusError,
            ) as exc:

                status_code = None

                if isinstance(
                    exc,
                    httpx.HTTPStatusError,
                ):
                    status_code = (
                        exc.response.status_code
                    )

                print(
                    "[JioSaavn] Request failed "
                    f"attempt {attempt + 1}/"
                    f"{self.MAX_RETRIES + 1}"
                    f" | status={status_code}"
                    f" | error={exc}"
                )

                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(0.5)
                    continue

                print(
                    "[JioSaavn] Provider unavailable. "
                    "Returning empty response."
                )

                return None

            except ValueError as exc:

                print(
                    "[JioSaavn] Invalid JSON response: "
                    f"{exc}"
                )

                return None

            except Exception as exc:

                print(
                    "[JioSaavn] Unexpected error: "
                    f"{exc}"
                )

                return None

        return None

    # ========================================================
    # TEXT HELPERS
    # ========================================================

    @staticmethod
    def _clean_text(value) -> str:

        if value is None:
            return ""

        return (
            str(value)
            .replace("&quot;", "'")
            .replace("&amp;", "&")
            .replace("&#039;", "'")
            .replace("&copy;", "©")
            .strip()
        )

    @staticmethod
    def _large_image(url: str | None) -> str | None:

        if not url:
            return None

        return (
            str(url)
            .replace("150x150", "500x500")
            .replace("50x50", "500x500")
        )

    # ========================================================
    # NORMALIZE SONG
    # ========================================================

    def _normalize_song(
        self,
        item: dict,
    ) -> dict | None:

        if not isinstance(item, dict):
            return None

        title = self._clean_text(
            item.get("song")
            or item.get("title")
        )

        artist = self._clean_text(
        item.get("primary_artists")
        or item.get("singers")
        or item.get("music")
        or (
            item.get("more_info", {}).get("primary_artists")
            if isinstance(item.get("more_info"), dict)
            else None
        )
    )

        if not title or not artist:
            return None

        song_id = (
            item.get("id")
            or item.get("songid")
            or ""
        )

        album = self._clean_text(
            item.get("album")
        )

        image = self._large_image(
            item.get("image")
        )

        duration = None

        try:
            raw_duration = item.get("duration")

            if raw_duration is not None:
                duration = int(
                    float(raw_duration)
                )

        except (
            TypeError,
            ValueError,
        ):
            duration = None

        more_info = item.get(
            "more_info"
        )

        if not isinstance(
            more_info,
            dict,
        ):
            more_info = {}

        # JioSaavn provides a preview-oriented
        # vlink in search metadata.
        preview_url = (
            more_info.get("vlink")
            or item.get("media_preview_url")
        )

        external_url = (
            item.get("url")
            or item.get("perma_url")
        )

        album_id = (
            item.get("albumid")
            or more_info.get("albumid")
            or ""
        )

        language = (
            item.get("language")
            or more_info.get("language")
        )

        release_date = (
            item.get("release_date")
            or more_info.get("release_date")
        )

        return {
            "id": str(song_id),
            "title": title,
            "artist": artist,
            "album": album,
            "provider": "jiosaavn",
            "image": image,
            "duration": duration,
            "preview_url": preview_url,
            "external_url": external_url,
            "album_id": str(album_id),
            "language": language,
            "release_date": release_date,
        }

    # ========================================================
    # SEARCH
    # ========================================================

    async def search_songs(
        self,
        query: str,
        limit: int = 25,
    ) -> list[dict]:

        query = (query or "").strip()

        if not query:
            return []

        limit = min(
            max(int(limit), 1),
            50,
        )

        params = {
            "__call": "autocomplete.get",
            "_format": "json",
            "_marker": "0",
            "cc": "in",
            "includeMetaTags": "1",
            "query": query,
        }

        data = await self._request(
            params=params,
            ttl=self.SEARCH_TTL,
        )

        if not data:
            return []

        songs_data = (
            data.get("songs", {})
            if isinstance(data, dict)
            else {}
        )

        if not isinstance(
            songs_data,
            dict,
        ):
            return []

        raw_songs = songs_data.get(
            "data",
            [],
        )

        if not isinstance(
            raw_songs,
            list,
        ):
            return []

        results = []

        for item in raw_songs:

            normalized = self._normalize_song(
                item
            )

            if normalized:
                results.append(
                    normalized
                )

            if len(results) >= limit:
                break

        api_cache.set(
            f"jiosaavn:search:{query.lower()}:{limit}",
            results,
            self.SEARCH_TTL,
        )

        print(
            "[JioSaavn search] Returning "
            f"{len(results)} results."
        )

        return results

    # ========================================================
    # SONG DETAILS
    # ========================================================

    async def get_song(
        self,
        song_id: str,
    ) -> dict:

        song_id = str(
            song_id or ""
        ).strip()

        if not song_id:
            return {}

        params = {
            "__call": "song.getDetails",
            "cc": "in",
            "_format": "json",
            "_marker": "0",
            "pids": song_id,
        }

        data = await self._request(
            params=params,
            ttl=self.LOOKUP_TTL,
        )

        if not data:
            return {}

        song_data = data.get(
            song_id
        )

        if not isinstance(
            song_data,
            dict,
        ):
            return {}

        normalized = self._normalize_song(
            song_data
        )

        if not normalized:
            return {}

        normalized.update(
            {
                "year": song_data.get(
                    "year"
                ),
                "copyright_text": self._clean_text(
                    song_data.get(
                        "copyright_text"
                    )
                ),
                "has_lyrics": (
                    song_data.get(
                        "has_lyrics"
                    ) == "true"
                ),
                "lyrics": None,
            }
        )

        # Keep the official JioSaavn page.
        normalized["external_url"] = (
            song_data.get("perma_url")
            or normalized.get("external_url")
        )

        # Do not expose or transform encrypted
        # protected media URLs.
        normalized.pop(
            "encrypted_media_url",
            None,
        )
        normalized.pop(
            "encrypted_drm_media_url",
            None,
        )

        return normalized

    # ========================================================
    # ARTIST
    # ========================================================

    async def get_artist(
        self,
        artist_id: str,
    ) -> dict:

        # The current JioSaavn API integration does
        # not expose a dedicated artist implementation
        # through our YOVI provider contract.
        #
        # Return an empty object rather than inventing
        # an endpoint or response structure.

        return {}

    # ========================================================
    # ALBUM
    # ========================================================

    async def get_album(
        self,
        album_id: str,
    ) -> dict:

        album_id = str(
            album_id or ""
        ).strip()

        if not album_id:
            return {}

        params = {
            "__call": "content.getAlbumDetails",
            "_format": "json",
            "cc": "in",
            "_marker": "0",
            "albumid": album_id,
        }

        data = await self._request(
            params=params,
            ttl=self.LOOKUP_TTL,
        )

        if not data:
            return {}

        album = data

        if not isinstance(
            album,
            dict,
        ):
            return {}

        songs = []

        for item in album.get(
            "songs",
            [],
        ):

            normalized = self._normalize_song(
                item
            )

            if normalized:
                songs.append(
                    normalized
                )

        return {
            "id": str(
                album.get(
                    "id"
                )
                or album_id
            ),
            "title": self._clean_text(
                album.get(
                    "name"
                )
                or album.get(
                    "title"
                )
            ),
            "artist": self._clean_text(
                album.get(
                    "primary_artists"
                )
                or album.get(
                    "music"
                )
            ),
            "image": self._large_image(
                album.get(
                    "image"
                )
            ),
            "year": album.get(
                "year"
            ),
            "language": album.get(
                "language"
            ),
            "songs": songs,
            "provider": "jiosaavn",
        }

    # ========================================================
    # PLAYLIST
    # ========================================================

    async def get_playlist(
        self,
        playlist_id: str,
    ) -> dict:

        playlist_id = str(
            playlist_id or ""
        ).strip()

        if not playlist_id:
            return {}

        params = {
            "__call": "playlist.getDetails",
            "_format": "json",
            "cc": "in",
            "_marker": "0",
            "listid": playlist_id,
        }

        data = await self._request(
            params=params,
            ttl=self.LOOKUP_TTL,
        )

        if not data:
            return {}

        if not isinstance(
            data,
            dict,
        ):
            return {}

        songs = []

        for item in data.get(
            "songs",
            [],
        ):

            normalized = self._normalize_song(
                item
            )

            if normalized:
                songs.append(
                    normalized
                )

        return {
            "id": str(
                data.get(
                    "id"
                )
                or playlist_id
            ),
            "name": self._clean_text(
                data.get(
                    "listname"
                )
            ),
            "firstname": self._clean_text(
                data.get(
                    "firstname"
                )
            ),
            "songs": songs,
            "provider": "jiosaavn",
        }

    # ========================================================
    # LYRICS
    # ========================================================

    async def get_lyrics(
        self,
        song_id: str,
    ) -> str | None:

        song_id = str(
            song_id or ""
        ).strip()

        if not song_id:
            return None

        params = {
            "__call": "lyrics.getLyrics",
            "ctx": "web6dot0",
            "api_version": "4",
            "_format": "json",
            "_marker": "0",
            "lyrics_id": song_id,
        }

        data = await self._request(
            params=params,
            ttl=self.LOOKUP_TTL,
        )

        if not data:
            return None

        lyrics = data.get(
            "lyrics"
        )

        if not lyrics:
            return None

        return str(
            lyrics
        )

    # ========================================================
    # SONG URL → ID
    # ========================================================

    async def resolve_song_id(
        self,
        url: str,
    ) -> str | None:

        url = (url or "").strip()

        if not url:
            return None

        try:
            async with httpx.AsyncClient(
                timeout=self.REQUEST_TIMEOUT,
                follow_redirects=True,
            ) as client:

                response = await client.get(
                    url
                )

                response.raise_for_status()

                text = response.text

            # Common Saavn page pattern.
            marker = '"pid":"'

            if marker in text:
                return (
                    text.split(marker, 1)[1]
                    .split('"', 1)[0]
                )

            return None

        except Exception as exc:

            print(
                "[JioSaavn] Failed to resolve "
                f"song URL: {exc}"
            )

            return None


# ============================================================
# SERVICE INSTANCE
# ============================================================

jiosaavn_service = JioSaavnService()