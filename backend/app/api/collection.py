from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db

from app.models.collection import (
    CollectionItem,
    PlaylistItem,
    UserPlaylist,
)

from app.models.user import User

from app.schemas.collection import (
    CollectionSongCreate,
    CollectionSongResponse,
    PlaylistCreate,
    PlaylistResponse,
)


router = APIRouter(
    prefix="/collections",
    tags=["Collections"],
)


# ============================================================
# HELPERS
# ============================================================

def song_identity(
    song: CollectionSongCreate,
):
    return (
        song.external_source or "",
        song.external_id or "",
    )


def serialize_playlist(
    playlist: UserPlaylist,
    db: Session,
):
    items = (
        db.query(PlaylistItem)
        .filter(
            PlaylistItem.playlist_id == playlist.id
        )
        .order_by(
            PlaylistItem.created_at.asc()
        )
        .all()
    )

    songs = []

    for item in items:
        songs.append(
            {
                "id": item.id,
                "collection_type": "playlist",
                "external_id": item.external_id,
                "external_source": item.external_source,
                "title": item.title,
                "artist": item.artist,
                "album": item.album,
                "image": item.image,
                "cover_url": item.cover_url,
                "video_id": item.video_id,
                "language": item.language,
                "genre": item.genre,
                "mood": item.mood,
                "created_at": item.created_at,
            }
        )

    return {
        "id": playlist.id,
        "name": playlist.name,
        "created_at": playlist.created_at,
        "songs": songs,
    }


# ============================================================
# LIBRARY
# ============================================================

@router.get(
    "/library",
    response_model=list[CollectionSongResponse],
)
def get_library(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Return the authenticated user's library.
    """

    return (
        db.query(CollectionItem)
        .filter(
            CollectionItem.user_id == current_user.id,
            CollectionItem.collection_type == "library",
        )
        .order_by(
            CollectionItem.created_at.desc()
        )
        .all()
    )


@router.post(
    "/library",
    response_model=CollectionSongResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_library(
    song: CollectionSongCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Add a song to the authenticated user's library.
    """

    source, external_id = song_identity(song)

    existing = (
        db.query(CollectionItem)
        .filter(
            CollectionItem.user_id == current_user.id,
            CollectionItem.collection_type == "library",
            CollectionItem.external_source == source,
            CollectionItem.external_id == external_id,
        )
        .first()
    )

    if existing:
        return existing

    item = CollectionItem(
        user_id=current_user.id,
        collection_type="library",
        external_id=song.external_id,
        external_source=song.external_source,
        title=song.title.strip(),
        artist=song.artist,
        album=song.album,
        image=song.image,
        cover_url=song.cover_url,
        video_id=song.video_id,
        language=song.language,
        genre=song.genre,
        mood=song.mood,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.delete(
    "/library/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_from_library(
    item_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Remove a song from the authenticated user's library.
    """

    item = (
        db.query(CollectionItem)
        .filter(
            CollectionItem.id == item_id,
            CollectionItem.user_id == current_user.id,
            CollectionItem.collection_type == "library",
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Library item not found.",
        )

    db.delete(item)
    db.commit()


# ============================================================
# FAVORITES
# ============================================================

@router.get(
    "/favorites",
    response_model=list[CollectionSongResponse],
)
def get_favorites(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Return the authenticated user's favorites.
    """

    return (
        db.query(CollectionItem)
        .filter(
            CollectionItem.user_id == current_user.id,
            CollectionItem.collection_type == "favorites",
        )
        .order_by(
            CollectionItem.created_at.desc()
        )
        .all()
    )


@router.post(
    "/favorites",
    response_model=CollectionSongResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_favorites(
    song: CollectionSongCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Add a song to the authenticated user's favorites.
    """

    source, external_id = song_identity(song)

    existing = (
        db.query(CollectionItem)
        .filter(
            CollectionItem.user_id == current_user.id,
            CollectionItem.collection_type == "favorites",
            CollectionItem.external_source == source,
            CollectionItem.external_id == external_id,
        )
        .first()
    )

    if existing:
        return existing

    item = CollectionItem(
        user_id=current_user.id,
        collection_type="favorites",
        external_id=song.external_id,
        external_source=song.external_source,
        title=song.title.strip(),
        artist=song.artist,
        album=song.album,
        image=song.image,
        cover_url=song.cover_url,
        video_id=song.video_id,
        language=song.language,
        genre=song.genre,
        mood=song.mood,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.delete(
    "/favorites/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_from_favorites(
    item_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Remove a song from the authenticated user's favorites.
    """

    item = (
        db.query(CollectionItem)
        .filter(
            CollectionItem.id == item_id,
            CollectionItem.user_id == current_user.id,
            CollectionItem.collection_type == "favorites",
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Favorite item not found.",
        )

    db.delete(item)
    db.commit()


# ============================================================
# PLAYLISTS
# ============================================================

@router.get(
    "/playlists/all",
    response_model=list[PlaylistResponse],
)
def get_playlists(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Return only playlists belonging to the
    authenticated user.
    """

    playlists = (
        db.query(UserPlaylist)
        .filter(
            UserPlaylist.user_id == current_user.id
        )
        .order_by(
            UserPlaylist.created_at.asc()
        )
        .all()
    )

    return [
        serialize_playlist(
            playlist,
            db,
        )
        for playlist in playlists
    ]


# ============================================================
# CREATE PLAYLIST
# ============================================================

@router.post(
    "/playlists",
    response_model=PlaylistResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_playlist(
    playlist_data: PlaylistCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Create a playlist for the authenticated user.
    """

    name = playlist_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Playlist name cannot be empty.",
        )

    existing = (
        db.query(UserPlaylist)
        .filter(
            UserPlaylist.user_id == current_user.id,
            UserPlaylist.name == name,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Playlist already exists.",
        )

    playlist = UserPlaylist(
        user_id=current_user.id,
        name=name,
    )

    db.add(playlist)
    db.commit()
    db.refresh(playlist)

    return serialize_playlist(
        playlist,
        db,
    )


# ============================================================
# DELETE PLAYLIST
# ============================================================

@router.delete(
    "/playlists/{playlist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_playlist(
    playlist_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Delete only a playlist belonging to the
    authenticated user.
    """

    playlist = (
        db.query(UserPlaylist)
        .filter(
            UserPlaylist.id == playlist_id,
            UserPlaylist.user_id == current_user.id,
        )
        .first()
    )

    if not playlist:
        raise HTTPException(
            status_code=404,
            detail="Playlist not found.",
        )

    db.delete(playlist)
    db.commit()


# ============================================================
# ADD SONG TO PLAYLIST
# ============================================================

@router.post(
    "/playlists/{playlist_id}/songs",
    response_model=CollectionSongResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_song_to_playlist(
    playlist_id: int,
    song: CollectionSongCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Add a song to a playlist belonging to
    the authenticated user.
    """

    playlist = (
        db.query(UserPlaylist)
        .filter(
            UserPlaylist.id == playlist_id,
            UserPlaylist.user_id == current_user.id,
        )
        .first()
    )

    if not playlist:
        raise HTTPException(
            status_code=404,
            detail="Playlist not found.",
        )

    source, external_id = song_identity(song)

    existing = (
        db.query(PlaylistItem)
        .filter(
            PlaylistItem.playlist_id == playlist.id,
            PlaylistItem.external_source == source,
            PlaylistItem.external_id == external_id,
        )
        .first()
    )

    if existing:
        return {
            "id": existing.id,
            "collection_type": "playlist",
            "external_id": existing.external_id,
            "external_source": existing.external_source,
            "title": existing.title,
            "artist": existing.artist,
            "album": existing.album,
            "image": existing.image,
            "cover_url": existing.cover_url,
            "video_id": existing.video_id,
            "language": existing.language,
            "genre": existing.genre,
            "mood": existing.mood,
            "created_at": existing.created_at,
        }

    item = PlaylistItem(
        playlist_id=playlist.id,
        external_id=song.external_id,
        external_source=song.external_source,
        title=song.title.strip(),
        artist=song.artist,
        album=song.album,
        image=song.image,
        cover_url=song.cover_url,
        video_id=song.video_id,
        language=song.language,
        genre=song.genre,
        mood=song.mood,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "id": item.id,
        "collection_type": "playlist",
        "external_id": item.external_id,
        "external_source": item.external_source,
        "title": item.title,
        "artist": item.artist,
        "album": item.album,
        "image": item.image,
        "cover_url": item.cover_url,
        "video_id": item.video_id,
        "language": item.language,
        "genre": item.genre,
        "mood": item.mood,
        "created_at": item.created_at,
    }


# ============================================================
# REMOVE SONG FROM PLAYLIST
# ============================================================

@router.delete(
    "/playlists/{playlist_id}/songs/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_song_from_playlist(
    playlist_id: int,
    item_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Remove a song only from a playlist belonging
    to the authenticated user.
    """

    playlist = (
        db.query(UserPlaylist)
        .filter(
            UserPlaylist.id == playlist_id,
            UserPlaylist.user_id == current_user.id,
        )
        .first()
    )

    if not playlist:
        raise HTTPException(
            status_code=404,
            detail="Playlist not found.",
        )

    item = (
        db.query(PlaylistItem)
        .filter(
            PlaylistItem.id == item_id,
            PlaylistItem.playlist_id == playlist.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Playlist song not found.",
        )

    db.delete(item)
    db.commit()