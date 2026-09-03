import asyncio

import httpx

from app.core.api_cache import api_cache


class JioSaavnService:

    # ========================================================
    # PRODUCTION JIOSAAVN API
    # ========================================================

    BASE_URL = (
        "https://yovi-music-jio-saavn.onrender.com"
    )

    # Successful searches are cached for 1 hour.
    SEARCH_TTL = 60 * 60

    # Keep search responsive when the Render service is asleep.
    REQUEST_TIMEOUT = 5.0

    # One retry is enough for a temporary 502 / cold-start issue.
    MAX_RETRIES = 1


    # ========================================================
    # SEARCH
    # ========================================================

    async def search_songs(
        self,
        query: str,
        limit: int = 25,
    ) -> list[dict]:

        query = (
            query or ""
        ).strip()


        if not query:
            return []


        limit = min(
            max(
                int(limit),
                1,
            ),
            50,
        )


        # ====================================================
        # CACHE KEY
        # ====================================================

        cache_key = (
            f"jiosaavn:search:"
            f"{query.lower()}:{limit}"
        )


        # ====================================================
        # CACHE
        # ====================================================

        cached = api_cache.get(
            cache_key
        )


        if cached is not None:

            print(
                "[API CACHE HIT] "
                "JioSaavn search"
            )

            return cached


        print(
            "[API CACHE MISS] "
            "JioSaavn search"
        )


        # ====================================================
        # REQUEST WITH LIMITED RETRY
        # ====================================================

        data = None


        for attempt in range(
            self.MAX_RETRIES + 1
        ):

            try:

                async with httpx.AsyncClient(
                    timeout=self.REQUEST_TIMEOUT
                ) as client:

                    response = await client.get(

                        f"{self.BASE_URL}/song/",

                        params={

                            "query":
                                query,

                            "lyrics":
                                "false",

                            "songdata":
                                "true",

                        },

                    )


                # --------------------------------------------
                # HTTP ERROR CHECK
                # --------------------------------------------

                response.raise_for_status()


                # --------------------------------------------
                # JSON
                # --------------------------------------------

                data = response.json()


                print(
                    "[JioSaavn search] "
                    f"Request succeeded on attempt "
                    f"{attempt + 1}."
                )


                break


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
                    "[JioSaavn search] "
                    f"Attempt {attempt + 1}/"
                    f"{self.MAX_RETRIES + 1} failed"
                    f" | status={status_code}"
                    f" | error={exc}"
                )


                # --------------------------------------------
                # RETRY ONCE
                # --------------------------------------------

                if attempt < self.MAX_RETRIES:

                    await asyncio.sleep(
                        0.5
                    )

                    continue


                # --------------------------------------------
                # SOFT FAILURE
                #
                # JioSaavn is an optional provider.
                # Never allow it to break YOVI search.
                # --------------------------------------------

                print(
                    "[JioSaavn search] "
                    "Provider unavailable. "
                    "Returning empty results so "
                    "other providers can continue."
                )

                return []


            except ValueError as exc:

                print(
                    "[JioSaavn search] "
                    f"Invalid JSON response: {exc}"
                )

                return []


            except Exception as exc:

                print(
                    "[JioSaavn search] "
                    f"Unexpected error: {exc}"
                )

                return []


        # ====================================================
        # VALIDATE RESPONSE
        # ====================================================

        if not isinstance(
            data,
            list,
        ):

            print(
                "[JioSaavn search] "
                "Invalid upstream response."
            )

            return []


        results = []


        # ====================================================
        # NORMALIZE RESULTS
        # ====================================================

        for item in data[:limit]:

            if not isinstance(
                item,
                dict,
            ):
                continue


            # ------------------------------------------------
            # TITLE
            # ------------------------------------------------

            title = (

                item.get(
                    "song"
                )

                or item.get(
                    "title"
                )

                or ""

            )


            if not isinstance(
                title,
                str,
            ):

                title = str(
                    title
                )


            title = title.strip()


            # ------------------------------------------------
            # ARTIST
            # ------------------------------------------------

            artist = (

                item.get(
                    "primary_artists"
                )

                or item.get(
                    "music"
                )

                or item.get(
                    "singers"
                )

                or ""

            )


            if not isinstance(
                artist,
                str,
            ):

                artist = str(
                    artist
                )


            artist = artist.strip()


            # ------------------------------------------------
            # VALID RESULT
            # ------------------------------------------------

            if not title or not artist:
                continue


            # ------------------------------------------------
            # DURATION
            # ------------------------------------------------

            duration = None


            try:

                raw_duration = item.get(
                    "duration"
                )


                if raw_duration is not None:

                    duration = int(
                        float(
                            raw_duration
                        )
                    )


            except (
                TypeError,
                ValueError,
            ):

                duration = None


            # ------------------------------------------------
            # SONG ID
            # ------------------------------------------------

            song_id = (

                item.get(
                    "id"
                )

                or item.get(
                    "songid"
                )

                or ""

            )


            # ------------------------------------------------
            # NORMALIZED YOVI RESULT
            # ------------------------------------------------

            results.append({

                "id":
                    str(
                        song_id
                    ),

                "title":
                    title,

                "artist":
                    artist,

                "album":
                    (
                        item.get(
                            "album"
                        )
                        or ""
                    ),

                "image":
                    item.get(
                        "image"
                    ),

                "provider":
                    "jiosaavn",

                "duration":
                    duration,

                "preview_url":
                    (
                        item.get(
                            "media_preview_url"
                        )

                        or item.get(
                            "vlink"
                        )
                    ),

                "external_url":
                    (
                        item.get(
                            "perma_url"
                        )

                        or item.get(
                            "url"
                        )
                    ),

                "album_id":
                    str(
                        item.get(
                            "albumid"
                        )
                        or ""
                    ),

                "language":
                    item.get(
                        "language"
                    ),

                "release_date":
                    item.get(
                        "release_date"
                    ),

            })


        # ====================================================
        # CACHE SUCCESSFUL RESULTS
        # ====================================================

        api_cache.set(

            cache_key,

            results,

            self.SEARCH_TTL,

        )


        print(
            "[JioSaavn search] "
            f"Returning {len(results)} results."
        )


        return results


# ============================================================
# SERVICE INSTANCE
# ============================================================

jiosaavn_service = JioSaavnService()