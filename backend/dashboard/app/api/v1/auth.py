from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User, UserProfile
from app.core.supabase import supabase


router = APIRouter()


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    
    Returns:
        UserProfile with user and organization data
    """
    user_id = current_user.id
    
    # Get organization data if exists
    try:
        org_response = supabase.table("organizations").select("*").eq("user_id", user_id).execute()
        
        if org_response.data and len(org_response.data) > 0:
            org = org_response.data[0]
            return UserProfile(
                id=current_user.id,
                email=current_user.email,
                created_at=current_user.created_at,
                organization_id=org.get("id"),
                company_name=org.get("company_name")
            )
    except Exception as e:
        # Organization doesn't exist yet, return basic user info
        pass
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at
    )


@router.post("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Verify the authentication token.
    
    Returns:
        Token validity status and user ID
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }

