"""
Profile Analysis API

Analyzes user platform data using Grok AI to infer demographic segments
and recommend products to advertise.
"""

import sys
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# Add the videos directory to path to import grok_client
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'videos'))

from grok_client import GrokClient

from app.core.security import get_current_user


router = APIRouter()


class PlatformData(BaseModel):
    """Platform data collected from the frontend."""
    shows_watched: list[str] = []
    cookies: dict = {}
    browsing_history: list[str] = []


class ProfileAnalysisRequest(BaseModel):
    """Request body for profile analysis."""
    platform_data: PlatformData


class ProfileAnalysisResponse(BaseModel):
    """Response from profile analysis."""
    user_info: dict
    platform_data: dict
    grok_analysis: dict
    final_decision: dict


@router.post("/analyze", response_model=ProfileAnalysisResponse)
async def analyze_profile(
    request: ProfileAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze user profile based on platform data to infer demographic segments
    and recommend products.
    
    Uses Grok AI to analyze platform data (watch history, cookies) and infer:
    - Demographic segments (e.g., "20yo brown men in tech", "36yo women in finance")
    - Interests and preferences
    - Product recommendations based on segment
    
    Args:
        request: Contains platform_data
        current_user: Authenticated user from JWT token
    
    Returns:
        ProfileAnalysisResponse with user info, segment analysis, and product recommendation
    """
    try:
        # Initialize Grok client
        grok_client = GrokClient()
        
        # Prepare platform data dict
        platform_data_dict = {
            "shows": request.platform_data.shows_watched,
            "cookies": request.platform_data.cookies,
            "browsing_history": request.platform_data.browsing_history
        }
        
        # Analyze demographics with Grok
        print("Analyzing user demographics with Grok AI...")
        grok_analysis = grok_client.analyze_user_demographics(
            platform_data=platform_data_dict,
            x_api_data=None
        )
        print(f"  Inferred segment: {grok_analysis.get('demographics', {}).get('segment')}")
        
        # Get product recommendation
        print("Getting product recommendation from Grok AI...")
        final_decision = grok_client.suggest_product(grok_analysis)
        print(f"  Recommended: {final_decision.get('product')} by {final_decision.get('company')}")
        
        # Build response
        response = ProfileAnalysisResponse(
            user_info={
                "user_id": current_user["id"],
                "email": current_user["email"]
            },
            platform_data=platform_data_dict,
            grok_analysis=grok_analysis,
            final_decision=final_decision
        )
        
        # Log the full response to console
        import json
        print("\n" + "=" * 60)
        print("PROFILE ANALYSIS RESULT")
        print("=" * 60)
        print(json.dumps(response.model_dump(), indent=2))
        print("=" * 60 + "\n")
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    except Exception as e:
        print(f"Profile analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile analysis failed: {str(e)}")

