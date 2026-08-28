from pydantic import BaseModel


class YouTubeVideoResult(BaseModel):
    video_id: str
    title: str
    description: str
    channel_id: str
    channel_title: str
    thumbnail_url: str | None = None


class YouTubeSearchResponse(BaseModel):
    query: str
    count: int
    results: list[YouTubeVideoResult]