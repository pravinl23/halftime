from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class User(BaseModel):
    """User model."""
    id: str
    email: EmailStr
    created_at: datetime
    
    
class UserProfile(BaseModel):
    """Extended user profile with organization data."""
    id: str
    email: EmailStr
    created_at: datetime
    organization_id: Optional[str] = None
    company_name: Optional[str] = None

