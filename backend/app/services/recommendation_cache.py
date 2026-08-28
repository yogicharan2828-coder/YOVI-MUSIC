import time
from threading import Lock


# ============================================================
# CONFIGURATION
# ============================================================

# Maximum age of a recommendation cache entry.
#
# The history signature is checked separately, so a new
# listening event can invalidate the cache before this TTL.
#
# 30 minutes is a safety limit.
CACHE_TTL_SECONDS = 30 * 60


# ============================================================
# CACHE STORAGE
# ============================================================

_cache = {}

_cache_lock = Lock()


# ============================================================
# CACHE ENTRY
# ============================================================

def _make_cache_key(
    *,
    user_id=None,
    device_id=None,
):
    """
    Build an isolated cache key for either an authenticated
    user or an anonymous device.
    """

    if user_id is not None:

        return (
            "user",
            str(user_id),
        )


    if device_id:

        return (
            "device",
            str(device_id),
        )


    return None


# ============================================================
# GET
# ============================================================

def get(
    *,
    user_id=None,
    device_id=None,
    history_signature=None,
):
    """
    Return a cached recommendation response when it is still
    valid for the supplied listening-history signature.

    A changed signature means the user/device has listened to
    something new, so the recommendation cache is invalidated.
    """

    key = _make_cache_key(
        user_id=user_id,
        device_id=device_id,
    )


    if key is None:

        return None


    now = time.time()


    with _cache_lock:

        entry = _cache.get(
            key
        )


        if not entry:

            print(
                "[RECOMMENDATION CACHE MISS]"
            )

            return None


        # ----------------------------------------------------
        # TTL
        # ----------------------------------------------------

        if (
            now - entry["created_at"]
            > CACHE_TTL_SECONDS
        ):

            _cache.pop(
                key,
                None,
            )

            print(
                "[RECOMMENDATION CACHE EXPIRED]"
            )

            return None


        # ----------------------------------------------------
        # HISTORY SIGNATURE
        # ----------------------------------------------------

        if (
            entry["history_signature"]
            != history_signature
        ):

            _cache.pop(
                key,
                None,
            )

            print(
                "[RECOMMENDATION CACHE INVALIDATED]"
            )

            return None


        print(
            "[RECOMMENDATION CACHE HIT]"
        )


        return entry["data"]


# ============================================================
# SET
# ============================================================

def set(
    *,
    user_id=None,
    device_id=None,
    history_signature=None,
    data=None,
):
    """
    Store a completed recommendation response.
    """

    key = _make_cache_key(
        user_id=user_id,
        device_id=device_id,
    )


    if key is None:

        return


    with _cache_lock:

        _cache[key] = {

            "created_at":
                time.time(),

            "history_signature":
                history_signature,

            "data":
                data,

        }


    print(
        "[RECOMMENDATION CACHE SET]"
    )


# ============================================================
# INVALIDATE
# ============================================================

def invalidate(
    *,
    user_id=None,
    device_id=None,
):
    """
    Explicitly remove recommendations for a user/device.
    """

    key = _make_cache_key(
        user_id=user_id,
        device_id=device_id,
    )


    if key is None:

        return


    with _cache_lock:

        removed = _cache.pop(
            key,
            None,
        )


    if removed:

        print(
            "[RECOMMENDATION CACHE INVALIDATED]"
        )


# ============================================================
# CLEAR
# ============================================================

def clear():
    """
    Clear all recommendation cache entries.

    Useful during development/testing.
    """

    with _cache_lock:

        _cache.clear()


    print(
        "[RECOMMENDATION CACHE CLEARED]"
    )