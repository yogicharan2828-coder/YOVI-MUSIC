import hashlib
import json
import sqlite3
import threading
import time
from pathlib import Path


CACHE_DIR = Path(__file__).resolve().parents[3] / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

CACHE_DB = CACHE_DIR / "youtube_search.sqlite3"


class YouTubeSearchCache:
    """Small persistent SQLite cache for YouTube search responses.

    The cache is intentionally independent of the application's main DB so
    it works with SQLite/Postgres/Supabase without requiring a migration.
    Successful responses are kept for 30 days. Stale entries are retained
    and can still be returned when YouTube is unavailable or quota-limited.
    """

    TTL_SECONDS = 30 * 24 * 60 * 60

    def __init__(self):
        self._lock = threading.Lock()
        self._initialize()

    @staticmethod
    def _normalize(query: str, limit: int, region_code: str) -> str:
        normalized = " ".join(query.strip().lower().split())
        return f"{normalized}|{limit}|{region_code.upper()}"

    def _key(self, query: str, limit: int, region_code: str) -> str:
        value = self._normalize(query, limit, region_code)
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    def _connect(self):
        connection = sqlite3.connect(
            CACHE_DB,
            timeout=10,
        )
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _initialize(self):
        with self._lock:
            connection = self._connect()
            try:
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS youtube_search_cache (
                        cache_key TEXT PRIMARY KEY,
                        query TEXT NOT NULL,
                        limit_value INTEGER NOT NULL,
                        region_code TEXT NOT NULL,
                        response_json TEXT NOT NULL,
                        fetched_at INTEGER NOT NULL
                    )
                    """
                )
                connection.commit()
            finally:
                connection.close()

    def get(self, query: str, limit: int, region_code: str):
        key = self._key(query, limit, region_code)

        with self._lock:
            connection = self._connect()
            try:
                row = connection.execute(
                    """
                    SELECT response_json, fetched_at
                    FROM youtube_search_cache
                    WHERE cache_key = ?
                    """,
                    (key,),
                ).fetchone()
            finally:
                connection.close()

        if not row:
            return None

        try:
            data = json.loads(row[0])
        except (TypeError, json.JSONDecodeError):
            return None

        fetched_at = int(row[1])
        fresh = (time.time() - fetched_at) < self.TTL_SECONDS

        return {
            "data": data,
            "fresh": fresh,
            "fetched_at": fetched_at,
        }

    def set(
        self,
        query: str,
        limit: int,
        region_code: str,
        data,
    ):
        key = self._key(query, limit, region_code)
        now = int(time.time())

        payload = json.dumps(
            data,
            ensure_ascii=False,
        )

        with self._lock:
            connection = self._connect()
            try:
                connection.execute(
                    """
                    INSERT INTO youtube_search_cache (
                        cache_key,
                        query,
                        limit_value,
                        region_code,
                        response_json,
                        fetched_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        response_json = excluded.response_json,
                        fetched_at = excluded.fetched_at
                    """,
                    (
                        key,
                        query.strip(),
                        limit,
                        region_code.upper(),
                        payload,
                        now,
                    ),
                )
                connection.commit()
            finally:
                connection.close()


youtube_search_cache = YouTubeSearchCache()
