from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import supabase


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify the JWT token and return the current user.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        User data dictionary
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    try:
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user.user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

