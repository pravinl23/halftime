"""
Videos API Router

Combines all video-related endpoints.
"""

from fastapi import APIRouter
from app.api.v1.videos import process, playlist, segments

router = APIRouter()

# Include sub-routers
router.include_router(process.router, tags=["videos"])
router.include_router(playlist.router, tags=["videos"])
router.include_router(segments.router, tags=["videos"])

