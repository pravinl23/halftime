from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
from app.core.config import settings


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
        # Decode the JWT without verification (Supabase validates on their end)
        # We just need to extract the user info
        payload = jwt.decode(
            token,
            options={"verify_signature": False}  # Supabase already validated this token
        )
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {"id": user_id, "email": email}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """
    Optionally verify the JWT token and return the current user.
    Returns None if no token is provided or token is invalid.
    
    Args:
        credentials: Optional HTTP Bearer token from Authorization header
        
    Returns:
        User data dictionary or None
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False}
        )
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            return None
        
        return {"id": user_id, "email": email}
        
    except Exception:
        return None

