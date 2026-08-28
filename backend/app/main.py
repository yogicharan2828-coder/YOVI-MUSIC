from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.base import Base
from app.database.connection import engine

from app.models import User, Artist, Album, Song, ListeningEvent

from app.api.auth import router as auth_router
from app.api.music import router as music_router
from app.api.youtube import router as youtube_router
from app.api.lyrics import router as lyrics_router
from app.api.player import router as player_router
from app.api.jam import router as jam_router
from app.api.listening import router as listening_router
from app.api.recommendations import router as recommendations_router
from app.api.explore import router as explore_router
from app.api.collection import router as collection_router


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="YOVI Music API",
    description="AI-first music streaming and social listening platform",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # ----------------------------------------------------
        # LOCAL DEVELOPMENT
        # ----------------------------------------------------
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # ----------------------------------------------------
        # PRODUCTION FRONTEND
        # ----------------------------------------------------
        "https://yovimusic.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(music_router)
app.include_router(youtube_router)
app.include_router(player_router)
app.include_router(lyrics_router)
app.include_router(jam_router)
app.include_router(listening_router)
app.include_router(recommendations_router)
app.include_router(explore_router)
app.include_router(collection_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Welcome to YOVI Music API",
        "status": "online",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )


        return {
            "status": "healthy",
            "database": "connected",
        }


    except Exception as e:

        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }