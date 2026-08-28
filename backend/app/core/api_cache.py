import time
from typing import Any


class APICache:

    def __init__(self):
        self._cache: dict[
            str,
            tuple[float, Any]
        ] = {}


    # ========================================================
    # GET
    # ========================================================

    def get(
        self,
        key: str,
    ):

        entry = self._cache.get(
            key
        )

        if entry is None:

            return None


        expires_at, value = entry


        if time.monotonic() >= expires_at:

            self._cache.pop(
                key,
                None,
            )

            return None


        return {
            "hit": True,
            "value": value,
        }


    # ========================================================
    # SET
    # ========================================================

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int,
    ):

        self._cache[key] = (
            time.monotonic()
            + ttl_seconds,

            value,
        )


    # ========================================================
    # DELETE
    # ========================================================

    def delete(
        self,
        key: str,
    ):

        self._cache.pop(
            key,
            None,
        )


    # ========================================================
    # CLEAR
    # ========================================================

    def clear(self):

        self._cache.clear()


    # ========================================================
    # SIZE
    # ========================================================

    def size(self):

        return len(
            self._cache
        )


api_cache = APICache()