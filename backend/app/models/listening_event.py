from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ListeningEvent(Base):
    """
    A lightweight behavioral event emitted by the YOVI client.

    Listening events support both:
    - anonymous/device-based listeners
    - authenticated users in the future

    The event stores a small snapshot of song metadata because
    search results can come directly from external providers and
    may not yet exist in the local songs catalog.
    """

    __tablename__ = "listening_events"

    # ==========================================================
    # PRIMARY KEY
    # ==========================================================

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # ==========================================================
    # USER / DEVICE IDENTITY
    # ==========================================================

    # Nullable because YOVI currently supports anonymous
    # device-based listening.
    #
    # When authentication is implemented later, this field
    # can contain the authenticated user's ID.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    # Browser/device identity used while the user is anonymous.
    device_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    # ==========================================================
    # SONG IDENTITY
    # ==========================================================

    # Local catalog identity, when available.
    song_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "songs.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # Provider identity.
    external_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    external_source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    # ==========================================================
    # SONG SNAPSHOT
    # ==========================================================

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

    # ==========================================================
    # RECOMMENDATION METADATA
    # ==========================================================

    language: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        index=True,
    )

    genre: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )

    mood: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )
    image: Mapped[str | None] = mapped_column(
    String(500),
    nullable=True,
)

    cover_url: Mapped[str | None] = mapped_column(
    String(500),
    nullable=True,
)
    # ==========================================================
    # EVENT
    # ==========================================================

    event_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    position_seconds: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    duration_seconds: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # ==========================================================
    # TIMESTAMP
    # ==========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # ==========================================================
    # RELATIONSHIPS
    # ==========================================================

    user = relationship(
        "User"
    )

    song = relationship(
        "Song"
    )

    # ==========================================================
    # INDEXES
    # ==========================================================

    __table_args__ = (

        Index(
            "ix_listening_events_user_created",
            "user_id",
            "created_at",
        ),

        Index(
            "ix_listening_events_user_event_type",
            "user_id",
            "event_type",
        ),

        Index(
            "ix_listening_events_device_created",
            "device_id",
            "created_at",
        ),

        Index(
            "ix_listening_events_device_event_type",
            "device_id",
            "event_type",
        ),

    )