from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    album_id: Mapped[int | None] = mapped_column(
        ForeignKey("albums.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    duration_seconds: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    track_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    audio_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    preview_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    cover_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    lyrics_available: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    video_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    external_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    external_source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    album = relationship(
        "Album",
        back_populates="songs",
    )