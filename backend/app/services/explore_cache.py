import time
from threading import Lock


# ============================================================
# CONFIGURATION
# ============================================================

# Stable Explore content can live for a long time.
STABLE_CACHE_TTL_SECONDS = 6 * 60 * 60

# Personalized Made For You is refreshed by behaviour,
# not by every Explore visit.
PERSONALIZED_CACHE_TTL_SECONDS = 60 * 60


# ============================================================
# STORAGE
# ============================================================

_stable_cache = {}

_personalized_cache = {}

_cache_lock = Lock()


# ============================================================
# STABLE EXPLORE CACHE
# ============================================================

def get_stable(
    *,
    device_id=None,
):

    if not device_id:

        return None


    key = str(device_id)

    now = time.time()


    with _cache_lock:

        entry = _stable_cache.get(key)


        if not entry:

            print(
                "[EXPLORE STABLE CACHE MISS]"
            )

            return None


        if (
            now - entry["created_at"]
            > STABLE_CACHE_TTL_SECONDS
        ):

            _stable_cache.pop(
                key,
                None,
            )

            print(
                "[EXPLORE STABLE CACHE EXPIRED]"
            )

            return None


        print(
            "[EXPLORE STABLE CACHE HIT]"
        )

        return entry["data"]


# ============================================================
# SET STABLE EXPLORE CACHE
# ============================================================

def set_stable(
    *,
    device_id=None,
    data=None,
):

    if not device_id:

        return


    key = str(device_id)


    with _cache_lock:

        _stable_cache[key] = {

            "created_at":
                time.time(),

            "data":
                data,

        }


    print(
        "[EXPLORE STABLE CACHE SET]"
    )


# ============================================================
# PERSONALIZED CACHE
# ============================================================

def get_personalized(
    *,
    device_id=None,
):

    if not device_id:

        return None


    key = str(device_id)

    now = time.time()


    with _cache_lock:

        entry = _personalized_cache.get(
            key
        )


        if not entry:

            print(
                "[PERSONALIZED CACHE MISS]"
            )

            return None


        if (
            now - entry["created_at"]
            > PERSONALIZED_CACHE_TTL_SECONDS
        ):

            _personalized_cache.pop(
                key,
                None,
            )

            print(
                "[PERSONALIZED CACHE EXPIRED]"
            )

            return None


        print(
            "[PERSONALIZED CACHE HIT]"
        )

        return entry


# ============================================================
# SET PERSONALIZED CACHE
# ============================================================

def set_personalized(
    *,
    device_id=None,
    data=None,
    behavior_count=0,
):

    if not device_id:

        return


    key = str(device_id)


    with _cache_lock:

        _personalized_cache[key] = {

            "created_at":
                time.time(),

            "behavior_count":
                behavior_count,

            "data":
                data,

        }


    print(
        "[PERSONALIZED CACHE SET]"
    )


# ============================================================
# CLEAR PERSONALIZED CACHE
# ============================================================

def clear_personalized(
    *,
    device_id=None,
):

    if not device_id:

        return


    key = str(device_id)


    with _cache_lock:

        _personalized_cache.pop(
            key,
            None,
        )


    print(
        "[PERSONALIZED CACHE CLEARED]"
    )


# ============================================================
# CLEAR ALL
# ============================================================

def clear():

    with _cache_lock:

        _stable_cache.clear()

        _personalized_cache.clear()


    print(
        "[EXPLORE CACHES CLEARED]"
    )