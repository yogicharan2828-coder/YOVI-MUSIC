import asyncio
import os

import httpx

from app.core.api_cache import api_cache


class JioSaavnService:

    # ========================================================
    # BASE URL
    # ========================================================

    # Local development:
    #   http://127.0.0.1:8001
    #
    # Production:
    #   Set JIOSAAVN_BASE_URL in Render environment variables.
    #

    BASE_URL = os.getenv(
        "JIOSAAVN_BASE_URL",
        "http://127.0.0.1:8001",
    ).rstrip("/")


    SEARCH_TTL = 60 * 60

    REQUEST_TIMEOUT = 15.0

    MAX_RETRIES = 2


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
                "[API CACHE HIT] JioSaavn search"
            )

            return cached


        print(
            "[API CACHE MISS] JioSaavn search"
        )


        # ====================================================
        # REQUEST WITH RETRIES
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
                            "query": query,
                            "lyrics": "false",
                            "songdata": "true",
                        },
                    )


                response.raise_for_status()

                data = response.json()

                break


            except (
                httpx.HTTPError,
                ValueError,
            ) as exc:

                print(
                    f"[JioSaavn search attempt "
                    f"{attempt + 1}/{self.MAX_RETRIES + 1}] "
                    f"failed: {exc}"
                )


                if attempt < self.MAX_RETRIES:

                    await asyncio.sleep(
                        0.5 * (attempt + 1)
                    )

                    continue


                print(
                    "[JioSaavn search] "
                    "All attempts failed. "
                    "Returning empty results."
                )

                return []


            except Exception as exc:

                print(
                    f"[JioSaavn search] "
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


            title = (
                item.get("song")
                or item.get("title")
                or ""
            )


            if not isinstance(
                title,
                str,
            ):
                title = str(title)


            title = title.strip()


            artist = (
                item.get("primary_artists")
                or item.get("music")
                or item.get("singers")
                or ""
            )


            if not isinstance(
                artist,
                str,
            ):
                artist = str(artist)


            artist = artist.strip()


            if not title or not artist:
                continue


            # =================================================
            # DURATION
            # =================================================

            duration = None

            try:

                raw_duration = item.get(
                    "duration"
                )

                if raw_duration is not None:

                    duration = int(
                        float(raw_duration)
                    )

            except (
                TypeError,
                ValueError,
            ):

                duration = None


            # =================================================
            # ID
            # =================================================

            song_id = (
                item.get("id")
                or item.get("songid")
                or ""
            )


            # =================================================
            # RESULT
            # =================================================

            results.append({

                "id":
                    str(song_id),

                "title":
                    title,

                "artist":
                    artist,

                "album":
                    item.get(
                        "album"
                    )
                    or "",

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
        # CACHE SUCCESSFUL RESPONSE
        # ====================================================

        api_cache.set(
            cache_key,
            results,
            self.SEARCH_TTL,
        )


        print(
            f"[JioSaavn search] "
            f"Returning {len(results)} results."
        )


        return results


jiosaavn_service = JioSaavnService()