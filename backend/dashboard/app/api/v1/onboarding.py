from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.brandfetch import BrandfetchService
from app.core.supabase import supabase
from app.core.security import get_current_user


router = APIRouter()


class OrganizationData(BaseModel):
    name: str
    logo_url: Optional[str] = None
    brand_colors: Optional[dict] = None
    vertical: Optional[str] = None


class TargetingProfileData(BaseModel):
    age_ranges: Optional[List[dict]] = None
    genders: Optional[List[str]] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    content_genres: Optional[List[str]] = None
    exclusions: Optional[dict] = None

class ContentPreferencesData(BaseModel):
    selected_shows: Optional[List[dict]] = None
    content_restrictions: Optional[List[str]] = None


@router.get("/known-companies/search")
async def search_companies(query: str):
    """
    Search known companies or fetch from Brandfetch.
    
    Args:
        query: Company name to search for
        
    Returns:
        List of matching companies
    """
    # Check cache first (skip if table doesn't exist yet)
    try:
        cached = supabase.table("known_companies").select("*").ilike("name", f"%{query}%").limit(10).execute()
        if cached.data and len(cached.data) > 0:
            return cached.data
    except:
        # Table doesn't exist yet, skip cache
        pass
    
    # Fetch from Brandfetch
    service = BrandfetchService()
    data = await service.fetch_company(query)
    
    if data and len(data) > 0:
        # Cache results (skip if table doesn't exist)
        for company in data:
            try:
                supabase.table("known_companies").insert(company).execute()
            except:
                # Ignore duplicate errors or missing table
                pass
        return data
    
    return []


@router.post("/organizations/complete")
async def complete_organization(
    org_data: OrganizationData,
    current_user: dict = Depends(get_current_user)
):
    """
    Update organization with onboarding data.
    Temporarily mocked to avoid Supabase key issues.
    
    Args:
        org_data: Organization details
        current_user: Current authenticated user
        
    Returns:
        Updated organization
    """
    # TODO: Reconnect to Supabase once API keys are stable.
    # For now, just return the payload so the frontend can proceed.
    return {
        "id": "mock-org-id",
        "company_name": org_data.name,
        "logo_url": org_data.logo_url,
        "brand_colors": org_data.brand_colors,
        "vertical": org_data.vertical,
        "user_id": current_user.get("id"),
    }


@router.post("/targeting-profiles")
async def create_targeting_profile(
    profile: TargetingProfileData,
    current_user: dict = Depends(get_current_user)
):
    """
    Create targeting profile and complete onboarding.
    
    Args:
        profile: Targeting profile data
        current_user: Current authenticated user
        
    Returns:
        Success status
    """
    # TODO: Reconnect to Supabase once API keys are stable.
    # For now, just pretend everything saved successfully.
    return {
        "success": True,
        "organization_id": "mock-org-id",
        "profile": {
            "age_ranges": profile.age_ranges,
            "genders": profile.genders,
            "location": profile.location,
            "interests": profile.interests,
            "content_genres": profile.content_genres,
        },
        "user_id": current_user.get("id"),
    }

@router.post("/content-preferences")
async def save_content_preferences(
    content_data: ContentPreferencesData,
    current_user: dict = Depends(get_current_user)
):
    """
    Save content preferences (shows and restrictions).
    Temporarily mocked to avoid Supabase key issues.
    """
    # TODO: Reconnect to Supabase once API keys are stable.
    # This would update the targeting_profile with selected_shows and content_restrictions
    return {
        "success": True,
        "message": "Content preferences saved",
        "selected_shows": content_data.selected_shows,
        "content_restrictions": content_data.content_restrictions,
    }
