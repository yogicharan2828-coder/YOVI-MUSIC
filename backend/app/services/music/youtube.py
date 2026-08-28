import httpx

from app.core.config import settings
from app.services.music.youtube_cache import youtube_search_cache


YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


class YouTubeQuotaExceeded(Exception):
    """Raised when YouTube rejects a search because the project quota is exhausted."""


class YouTubeService:

    async def search_videos(
        self,
        query: str,
        limit: int = 10,
        region_code: str = "IN",
    ):
        limit = max(1, min(int(limit), 50))
        region_code = (region_code or "IN").upper()

        cached = youtube_search_cache.get(
            query=query,
            limit=limit,
            region_code=region_code,
        )

        # Fresh cache: do not spend another YouTube quota unit.
        if cached and cached["fresh"]:
            return cached["data"]

        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": limit,
            "regionCode": region_code,
            "key": settings.YOUTUBE_API_KEY,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    YOUTUBE_SEARCH_URL,
                    params=params,
                )
        except httpx.HTTPError:
            # If YouTube is temporarily unreachable, use stale cache if one exists.
            if cached:
                return cached["data"]
            raise

        if response.status_code != 200:
            try:
                error_data = response.json()
            except Exception:
                error_data = response.text

            error_text = str(error_data)

            if response.status_code == 429 or "quota" in error_text.lower():
                # A stale result is still much better than breaking playback.
                if cached:
                    return cached["data"]

                raise YouTubeQuotaExceeded(
                    "YouTube search quota is exhausted and this song is not cached."
                )

            if cached:
                return cached["data"]

            raise RuntimeError(
                f"YouTube API returned {response.status_code}: {error_data}"
            )

        data = response.json()

        # Only successful API responses enter the cache.
        youtube_search_cache.set(
            query=query,
            limit=limit,
            region_code=region_code,
            data=data,
        )

        return data

    async def search_song(
        self,
        title: str,
        artist: str,
    ):
        query = f"{title} {artist} official audio"

        data = await self.search_videos(
            query=query,
            limit=5,
            region_code="IN",
        )

        results = []

        for item in data.get("items", []):
            video_id = (
                item.get("id", {})
                .get("videoId")
            )

            if not video_id:
                continue

            snippet = item.get(
                "snippet",
                {}
            )

            thumbnails = snippet.get(
                "thumbnails",
                {}
            )

            results.append(
                {
                    "video_id": video_id,
                    "title": snippet.get(
                        "title"
                    ),
                    "channel": snippet.get(
                        "channelTitle"
                    ),
                    "thumbnail": (
                        thumbnails
                        .get("high", {})
                        .get("url")
                    ),
                }
            )

        return results


youtube_service = YouTubeService()
