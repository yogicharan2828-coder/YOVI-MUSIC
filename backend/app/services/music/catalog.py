from sqlalchemy.orm import Session

from app.models.artist import Artist
from app.models.album import Album
from app.models.song import Song


SOURCE = "itunes"


def get_or_create_artist(
    db: Session,
    external_id: str,
    name: str,
    image_url: str | None = None,
) -> Artist:

    artist = (
        db.query(Artist)
        .filter(
            Artist.external_id == external_id,
            Artist.external_source == SOURCE,
        )
        .first()
    )

    if artist:
        return artist

    artist = Artist(
        name=name,
        image_url=image_url,
        external_id=external_id,
        external_source=SOURCE,
    )

    db.add(artist)
    db.flush()

    return artist


def get_or_create_album(
    db: Session,
    external_id: str,
    title: str,
    artist: Artist,
    cover_url: str | None = None,
    release_date=None,
) -> Album:

    album = (
        db.query(Album)
        .filter(
            Album.external_id == external_id,
            Album.external_source == SOURCE,
        )
        .first()
    )

    if album:
        return album

    album = Album(
        artist_id=artist.id,
        title=title,
        cover_url=cover_url,
        release_date=release_date,
        external_id=external_id,
        external_source=SOURCE,
    )

    db.add(album)
    db.flush()

    return album


def get_or_create_song(
    db: Session,
    external_id: str,
    title: str,
    artist: Artist,
    album: Album | None = None,
    duration_seconds: int | None = None,
    preview_url: str | None = None,
    cover_url: str | None = None,
) -> Song:

    song = (
        db.query(Song)
        .filter(
            Song.external_id == external_id,
            Song.external_source == SOURCE,
        )
        .first()
    )

    if song:
        return song

    song = Song(
        title=title,
        album_id=album.id if album else None,
        duration_seconds=duration_seconds,
        preview_url=preview_url,
        cover_url=cover_url,
        external_id=external_id,
        external_source=SOURCE,
    )

    db.add(song)
    db.flush()

    return song


def sync_song(
    db: Session,
    song_data: dict,
) -> Song:

    artist_data = song_data["artist"]

    artist = get_or_create_artist(
        db=db,
        external_id=artist_data["id"],
        name=artist_data["name"],
    )

    album = None

    if song_data.get("album"):

        album_data = song_data["album"]

        album = get_or_create_album(
            db=db,
            external_id=album_data["id"],
            title=album_data["title"],
            artist=artist,
            cover_url=album_data.get("cover_url"),
        )

    song = get_or_create_song(
        db=db,
        external_id=song_data["id"],
        title=song_data["title"],
        artist=artist,
        album=album,
        duration_seconds=song_data.get(
            "duration_seconds"
        ),
        preview_url=song_data.get(
            "preview_url"
        ),
        cover_url=(
            song_data.get("album") or {}
        ).get("cover_url"),
    )

    db.commit()
    db.refresh(song)

    return song