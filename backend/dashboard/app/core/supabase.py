from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    # Use service key if available, otherwise fall back to anon key
    key = settings.supabase_service_key if settings.supabase_service_key else settings.supabase_anon_key
    return create_client(
        settings.supabase_url,
        key
    )


# Global Supabase client instance
supabase: Client = get_supabase_client()

