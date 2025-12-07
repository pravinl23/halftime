from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key
    )


# Global Supabase client instance
supabase: Client = get_supabase_client()
