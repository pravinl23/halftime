from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.supabase import supabase


router = APIRouter()


class OrganizationCreate(BaseModel):
    """Schema for creating an organization."""
    company_name: str


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization."""
    company_name: str


@router.post("/organization")
async def create_organization(
    org_data: OrganizationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create an organization for the current user.
    
    Args:
        org_data: Organization creation data
        current_user: Current authenticated user
        
    Returns:
        Created organization data
    """
    user_id = current_user.id
    
    # Check if organization already exists
    existing = supabase.table("organizations").select("*").eq("user_id", user_id).execute()
    
    if existing.data and len(existing.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization already exists for this user"
        )
    
    # Create organization
    result = supabase.table("organizations").insert({
        "user_id": user_id,
        "company_name": org_data.company_name
    }).execute()
    
    return result.data[0] if result.data else None


@router.get("/organization")
async def get_organization(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's organization.
    
    Returns:
        Organization data or None
    """
    user_id = current_user.id
    
    result = supabase.table("organizations").select("*").eq("user_id", user_id).execute()
    
    if not result.data or len(result.data) == 0:
        return None
    
    return result.data[0]


@router.patch("/organization")
async def update_organization(
    org_data: OrganizationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current user's organization.
    
    Args:
        org_data: Organization update data
        current_user: Current authenticated user
        
    Returns:
        Updated organization data
    """
    user_id = current_user.id
    
    result = supabase.table("organizations").update({
        "company_name": org_data.company_name,
        "updated_at": "now()"
    }).eq("user_id", user_id).execute()
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return result.data[0]

