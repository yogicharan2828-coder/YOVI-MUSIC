from abc import ABC, abstractmethod


class MusicProvider(ABC):

    @abstractmethod
    async def search_songs(
        self,
        query: str,
        limit: int = 25,
    ) -> dict:
        pass

    @abstractmethod
    async def get_song(
        self,
        song_id: str,
    ) -> dict:
        pass

    @abstractmethod
    async def get_artist(
        self,
        artist_id: str,
    ) -> dict:
        pass

    @abstractmethod
    async def get_album(
        self,
        album_id: str,
    ) -> dict:
        pass