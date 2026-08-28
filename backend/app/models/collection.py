from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CollectionItem(Base):
    __tablename__ = "collection_items"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "collection_type",
            "external_source",
            "external_id",
            name="uq_user_collection_song",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    collection_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    external_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    external_source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    artist: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    album: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    image: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    cover_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    video_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    language: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )

    genre: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    mood: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class UserPlaylist(Base):
    __tablename__ = "user_playlists"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "name",
            name="uq_user_playlist_name",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class PlaylistItem(Base):
    __tablename__ = "playlist_items"

    __table_args__ = (
        UniqueConstraint(
            "playlist_id",
            "external_source",
            "external_id",
            name="uq_playlist_song",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    playlist_id: Mapped[int] = mapped_column(
        ForeignKey(
            "user_playlists.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    external_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    external_source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    artist: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    album: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    image: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    cover_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    video_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    language: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )

    genre: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    mood: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )