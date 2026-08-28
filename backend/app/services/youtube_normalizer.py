from app.schemas.youtube import YouTubeVideoResult


def normalize_youtube_result(
    item: dict,
) -> YouTubeVideoResult:

    snippet = item.get("snippet", {})
    video_id = item.get("id", {}).get(
        "videoId",
        "",
    )

    thumbnails = snippet.get(
        "thumbnails",
        {},
    )

    thumbnail = (
        thumbnails.get("high")
        or thumbnails.get("medium")
        or thumbnails.get("default")
    )

    return YouTubeVideoResult(
        video_id=video_id,
        title=snippet.get(
            "title",
            "Unknown Video",
        ),
        description=snippet.get(
            "description",
            "",
        ),
        channel_id=snippet.get(
            "channelId",
            "",
        ),
        channel_title=snippet.get(
            "channelTitle",
            "Unknown Channel",
        ),
        thumbnail_url=(
            thumbnail.get("url")
            if thumbnail
            else None
        ),
    )