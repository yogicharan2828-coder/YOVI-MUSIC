import httpx

from app.core.api_cache import api_cache


class LyricsService:

    BASE_URL = "https://lrclib.net/api"

    USER_AGENT = (
        "YOVI-Music/1.0 "
        "(YOVI Music Platform)"
    )

    CACHE_TTL = 24 * 60 * 60


    # ========================================================
    # HTTP REQUEST
    # ========================================================

    async def _request(
        self,
        endpoint: str,
        params: dict,
    ):

        headers = {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(
            timeout=15.0
        ) as client:

            response = await client.get(
                f"{self.BASE_URL}/{endpoint}",
                params=params,
                headers=headers,
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()

            return response.json()


    # ========================================================
    # GET LYRICS
    # ========================================================

    async def get_lyrics(
        self,
        title: str,
        artist: str,
        album: str | None = None,
        duration: float | None = None,
    ):

        normalized_title = (
            title.strip()
            .lower()
        )

        normalized_artist = (
            artist.strip()
            .lower()
        )

        normalized_album = (
            album.strip().lower()
            if album
            else ""
        )

        normalized_duration = (
            round(duration)
            if duration and duration > 0
            else 0
        )


        # ----------------------------------------------------
        # CACHE KEY
        # ----------------------------------------------------

        cache_key = (
            "lyrics:"
            f"{normalized_title}:"
            f"{normalized_artist}:"
            f"{normalized_album}:"
            f"{normalized_duration}"
        )


        # ----------------------------------------------------
        # CACHE HIT
        # ----------------------------------------------------

        cached = api_cache.get(
            cache_key
        )

        if cached is not None:

            print(
                "[API CACHE HIT] Lyrics"
            )

            return cached


        print(
            "[API CACHE MISS] Lyrics"
        )


        # ----------------------------------------------------
        # EXACT LOOKUP
        # ----------------------------------------------------

        params = {
            "track_name": title.strip(),
            "artist_name": artist.strip(),
        }

        if album:

            params["album_name"] = (
                album.strip()
            )

        if duration and duration > 0:

            params["duration"] = round(
                duration
            )


        result = await self._request(
            "get",
            params,
        )


        # ----------------------------------------------------
        # ACCEPT EXACT MATCH ONLY WITH REAL LYRICS
        # ----------------------------------------------------

        if result:

            has_plain = bool(
                result.get(
                    "plainLyrics"
                )
            )

            has_synced = bool(
                result.get(
                    "syncedLyrics"
                )
            )

            is_instrumental = result.get(
                "instrumental",
                False,
            )

            if (
                (has_plain or has_synced)
                and not is_instrumental
            ):

                api_cache.set(
                    cache_key,
                    result,
                    self.CACHE_TTL,
                )

                return result


        # ----------------------------------------------------
        # FALLBACK SEARCH
        # ----------------------------------------------------

        search_query = (
            f"{title} {artist}"
        ).strip()


        results = await self._request(
            "search",
            {
                "q": search_query,
            },
        )


        if not results:

            api_cache.set(
                cache_key,
                None,
                self.CACHE_TTL,
            )

            return None


        # ----------------------------------------------------
        # NORMALIZATION
        # ----------------------------------------------------

        def normalize(value):

            if not value:
                return ""

            return (
                str(value)
                .strip()
                .lower()
                .replace("’", "'")
                .replace("–", "-")
                .replace("—", "-")
            )


        wanted_title = normalize(
            title
        )

        wanted_artist = normalize(
            artist
        )


        # ----------------------------------------------------
        # FIND BEST MATCH
        # ----------------------------------------------------

        best_match = None
        best_score = -1


        for item in results:

            item_title = normalize(
                item.get(
                    "trackName"
                )
            )

            item_artist = normalize(
                item.get(
                    "artistName"
                )
            )

            plain = item.get(
                "plainLyrics"
            )

            synced = item.get(
                "syncedLyrics"
            )

            instrumental = item.get(
                "instrumental",
                False,
            )


            if instrumental:
                continue


            if not plain and not synced:
                continue


            score = 0


            # ------------------------------------------------
            # TITLE
            # ------------------------------------------------

            if item_title == wanted_title:

                score += 60

            elif (
                wanted_title in item_title
                or item_title in wanted_title
            ):

                score += 35


            # ------------------------------------------------
            # ARTIST
            # ------------------------------------------------

            if item_artist == wanted_artist:

                score += 40

            elif (
                wanted_artist in item_artist
                or item_artist in wanted_artist
            ):

                score += 25


            # ------------------------------------------------
            # DURATION
            # ------------------------------------------------

            item_duration = item.get(
                "duration"
            )

            if (
                duration
                and item_duration
            ):

                difference = abs(
                    float(item_duration)
                    - float(duration)
                )

                if difference <= 2:

                    score += 30

                elif difference <= 5:

                    score += 15


            # ------------------------------------------------
            # SYNCED LYRICS
            # ------------------------------------------------

            if synced:

                score += 20


            # ------------------------------------------------
            # BEST
            # ------------------------------------------------

            if score > best_score:

                best_score = score
                best_match = item


        # ----------------------------------------------------
        # CACHE RESULT
        # ----------------------------------------------------

        api_cache.set(
            cache_key,
            best_match,
            self.CACHE_TTL,
        )


        return best_match


lyrics_service = LyricsService()