from app.schemas.music import (
    AlbumResult,
    ArtistResult,
    SongResult,
)


def normalize_itunes_song(
    item: dict,
) -> SongResult:

    artwork = item.get("artworkUrl100")

    if artwork:
        artwork = artwork.replace(
            "100x100",
            "600x600",
        )

    return SongResult(
        id=str(item.get("trackId", "")),
        title=item.get(
            "trackName",
            "Unknown",
        ),
        artist=ArtistResult(
            id=str(item.get("artistId", "")),
            name=item.get(
                "artistName",
                "Unknown Artist",
            ),
        ),
        album=AlbumResult(
            id=str(item.get("collectionId", "")),
            title=item.get(
                "collectionName",
                "Unknown Album",
            ),
            cover_url=artwork,
        ),
        duration_seconds=(
            item.get("trackTimeMillis", 0) // 1000
            if item.get("trackTimeMillis")
            else None
        ),
        preview_url=item.get("previewUrl"),
        release_date=item.get("releaseDate"),
        source="itunes",
    )


def normalize_itunes_results(
    data: dict,
) -> list[SongResult]:

    return [
        normalize_itunes_song(item)
        for item in data.get("results", [])
        if item.get("kind") == "song"
    ]