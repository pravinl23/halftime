from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Supabase
    supabase_url: str
    supabase_service_key: str | None = None
    supabase_anon_key: str
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    # API
    api_v1_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Allow extra env vars for other services (Grok, X API)


settings = Settings()

