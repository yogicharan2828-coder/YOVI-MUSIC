import httpx

from app.core.api_cache import api_cache


class DeezerService:

    BASE_URL = "https://api.deezer.com"

    SEARCH_TTL = 60 * 60


    # ========================================================
    # SEARCH TRACKS
    # ========================================================

    async def search_tracks(
        self,
        query: str,
        limit: int = 25,
    ):

        params = {
            "q": query.strip(),
            "limit": min(
                limit,
                50,
            ),
        }


        # ----------------------------------------------------
        # CACHE KEY
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
            f"deezer:search:{normalized_params}"
        )


        # ----------------------------------------------------
        # CACHE HIT
        # ----------------------------------------------------

        cached = api_cache.get(
            cache_key
        )

        if cached is not None:

            print(
                "[API CACHE HIT] Deezer search"
            )

            return cached


        print(
            "[API CACHE MISS] Deezer search"
        )


        # ----------------------------------------------------
        # EXTERNAL API
        # ----------------------------------------------------

        async with httpx.AsyncClient(
            timeout=10.0
        ) as client:

            response = await client.get(
                f"{self.BASE_URL}/search",
                params=params,
            )

            response.raise_for_status()

            data = response.json()


        # ----------------------------------------------------
        # CACHE
        # ----------------------------------------------------

        api_cache.set(
            cache_key,
            data,
            self.SEARCH_TTL,
        )


        return data


deezer_service = DeezerService()