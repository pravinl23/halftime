"""
Ad Analytics API

Tracks ad performance metrics including impressions, clicks, conversions, etc.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.security import get_current_user_optional


router = APIRouter()


class AdImpressionEvent(BaseModel):
    """Ad impression event - when an ad is shown to a user."""
    ad_id: str  # Unique identifier for the ad
    video_id: str  # Video/show where ad appeared
    show_name: str  # Name of the show/video
    product: str  # Product being advertised
    company: str  # Company name
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None  # Will be set from auth token
    ad_position: Optional[float] = None  # Position in video (seconds)


class AdClickEvent(BaseModel):
    """Ad click event - when user clicks on ad."""
    ad_id: str
    video_id: str
    show_name: str
    product: str
    company: str
    click_source: str  # "popup" or "progress_bar" or "marker"
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None
    ad_position: Optional[float] = None


class AdViewEvent(BaseModel):
    """Ad view event - when user views ad for certain duration."""
    ad_id: str
    video_id: str
    show_name: str
    product: str
    company: str
    view_duration: float  # Seconds viewed
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None
    ad_position: Optional[float] = None


class AdConversionEvent(BaseModel):
    """Ad conversion event - when user completes a conversion action."""
    ad_id: str
    video_id: str
    show_name: str
    product: str
    company: str
    conversion_type: str  # "purchase", "signup", "download", etc.
    conversion_value: Optional[float] = None  # Monetary value if applicable
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None
    ad_position: Optional[float] = None


class AdDismissEvent(BaseModel):
    """Ad dismiss event - when user dismisses/closes ad."""
    ad_id: str
    video_id: str
    show_name: str
    product: str
    company: str
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None
    ad_position: Optional[float] = None


@router.post("/impressions")
async def track_impression(
    event: AdImpressionEvent,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Track ad impression.
    
    In production, this would save to database.
    For now, we'll log it and return success.
    """
    event.user_id = current_user.get("id") if current_user else None
    event.timestamp = event.timestamp or datetime.now()
    
    # TODO: Save to database (impressions table)
    # For now, just log it
    print(f"[ANALYTICS] Impression: {event.ad_id} in {event.show_name} at {event.timestamp}")
    
    return {
        "success": True,
        "event_id": f"imp_{event.ad_id}_{int(event.timestamp.timestamp())}",
        "message": "Impression tracked"
    }


@router.post("/clicks")
async def track_click(
    event: AdClickEvent,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Track ad click.
    
    In production, this would save to database.
    """
    event.user_id = current_user.get("id") if current_user else None
    event.timestamp = event.timestamp or datetime.now()
    
    # TODO: Save to database (clicks table)
    print(f"[ANALYTICS] Click: {event.ad_id} from {event.click_source} in {event.show_name} at {event.timestamp}")
    
    return {
        "success": True,
        "event_id": f"click_{event.ad_id}_{int(event.timestamp.timestamp())}",
        "message": "Click tracked"
    }


@router.post("/views")
async def track_view(
    event: AdViewEvent,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Track ad view duration.
    """
    event.user_id = current_user.get("id") if current_user else None
    event.timestamp = event.timestamp or datetime.now()
    
    # TODO: Save to database (views table)
    print(f"[ANALYTICS] View: {event.ad_id} viewed for {event.view_duration}s in {event.show_name}")
    
    return {
        "success": True,
        "event_id": f"view_{event.ad_id}_{int(event.timestamp.timestamp())}",
        "message": "View tracked"
    }


@router.post("/conversions")
async def track_conversion(
    event: AdConversionEvent,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Track ad conversion.
    """
    event.user_id = current_user.get("id") if current_user else None
    event.timestamp = event.timestamp or datetime.now()
    
    # TODO: Save to database (conversions table)
    print(f"[ANALYTICS] Conversion: {event.ad_id} - {event.conversion_type} (value: {event.conversion_value}) in {event.show_name}")
    
    return {
        "success": True,
        "event_id": f"conv_{event.ad_id}_{int(event.timestamp.timestamp())}",
        "message": "Conversion tracked"
    }


@router.post("/dismissals")
async def track_dismissal(
    event: AdDismissEvent,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Track ad dismissal.
    """
    event.user_id = current_user.get("id") if current_user else None
    event.timestamp = event.timestamp or datetime.now()
    
    # TODO: Save to database (dismissals table)
    print(f"[ANALYTICS] Dismissal: {event.ad_id} dismissed in {event.show_name} at {event.timestamp}")
    
    return {
        "success": True,
        "event_id": f"dismiss_{event.ad_id}_{int(event.timestamp.timestamp())}",
        "message": "Dismissal tracked"
    }

