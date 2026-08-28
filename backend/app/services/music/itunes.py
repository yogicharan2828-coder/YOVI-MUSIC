import httpx

from app.services.music.base import MusicProvider
from app.core.api_cache import api_cache


class ITunesService(MusicProvider):

    BASE_URL = "https://itunes.apple.com"

    SEARCH_TTL = 60 * 60
    LOOKUP_TTL = 24 * 60 * 60


    # ========================================================
    # HTTP REQUEST
    # ========================================================

    async def _request(
        self,
        endpoint: str,
        params: dict,
        ttl: int,
    ) -> dict:

        # ----------------------------------------------------
        # BUILD STABLE CACHE KEY
        # ----------------------------------------------------

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
            f"itunes:{endpoint}:{normalized_params}"
        )


        # ----------------------------------------------------
        # CACHE
        # ----------------------------------------------------

        cached = api_cache.get(
            cache_key
        )

        if cached is not None:

            print(
                f"[API CACHE HIT] iTunes {endpoint}"
            )

            return cached


        print(
            f"[API CACHE MISS] iTunes {endpoint}"
        )


        # ----------------------------------------------------
        # EXTERNAL API
        # ----------------------------------------------------

        async with httpx.AsyncClient(
            timeout=10.0
        ) as client:

            response = await client.get(
                f"{self.BASE_URL}/{endpoint}",
                params=params,
            )

            response.raise_for_status()

            data = response.json()


        # ----------------------------------------------------
        # STORE
        # ----------------------------------------------------

        api_cache.set(
            cache_key,
            data,
            ttl,
        )


        return data


    # ========================================================
    # SEARCH
    # ========================================================

    async def search_songs(
        self,
        query: str,
        limit: int = 25,
    ):

        params = {
            "term": query.strip(),
            "media": "music",
            "entity": "song",
            "limit": min(
                limit,
                50,
            ),
        }

        return await self._request(
            "search",
            params,
            self.SEARCH_TTL,
        )


    # ========================================================
    # SONG
    # ========================================================

    async def get_song(
        self,
        song_id: str,
    ):

        params = {
            "id": song_id,
            "entity": "song",
        }

        return await self._request(
            "lookup",
            params,
            self.LOOKUP_TTL,
        )


    # ========================================================
    # ARTIST
    # ========================================================

    async def get_artist(
        self,
        artist_id: str,
    ):

        params = {
            "id": artist_id,
            "entity": "musicArtist",
        }

        return await self._request(
            "lookup",
            params,
            self.LOOKUP_TTL,
        )


    # ========================================================
    # ALBUM
    # ========================================================

    async def get_album(
        self,
        album_id: str,
    ):

        params = {
            "id": album_id,
            "entity": "album",
        }

        return await self._request(
            "lookup",
            params,
            self.LOOKUP_TTL,
        )


itunes_service = ITunesService()