from pydantic import BaseModel


class ArtistResult(BaseModel):
    id: str
    name: str


class AlbumResult(BaseModel):
    id: str
    title: str
    cover_url: str | None = None


class SongResult(BaseModel):
    id: str
    title: str
    artist: ArtistResult
    album: AlbumResult | None = None
    duration_seconds: int | None = None
    preview_url: str | None = None
    release_date: str | None = None
    source: str


class MusicSearchResponse(BaseModel):
    query: str
    count: int
    results: list[SongResult]


class SongDetailResponse(SongResult):
    pass


class ArtistDetailResponse(BaseModel):
    id: str
    name: str
    image_url: str | None = None
    source: str


class AlbumDetailResponse(BaseModel):
    id: str
    title: str
    artist: ArtistResult | None = None
    cover_url: str | None = None
    release_date: str | None = None
    source: str
    
class CatalogSongResponse(BaseModel):
    id: int
    external_id: str | None
    title: str
    duration_seconds: int | None
    preview_url: str | None
    cover_url: str | None
    external_source: str | None