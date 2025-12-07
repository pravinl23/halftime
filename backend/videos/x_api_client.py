"""
X (Twitter) API Client for User Demographics & Interests

Fetches user data from X API and combines with platform data.
Uses Grok AI to analyze and infer demographics, interests, and product preferences.
NO HARDCODED FALLBACKS - always uses Grok API for analysis.

Uses OAuth 1.0a for user-context authentication.

Requirements:
    pip install requests requests-oauthlib python-dotenv
"""

import os
import json
from typing import Optional
from dataclasses import dataclass, asdict
import requests
from requests_oauthlib import OAuth1
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))


@dataclass
class UserProfile:
    """User profile data from X API and Grok analysis."""
    user_id: Optional[str] = None
    username: Optional[str] = None
    interests: list = None
    demographics: dict = None
    content_preferences: list = None
    values: list = None
    product_affinities: list = None
    source: str = "grok_analysis"  # "grok_analysis" or "x_api_only"
    
    def __post_init__(self):
        if self.interests is None:
            self.interests = []
        if self.demographics is None:
            self.demographics = {}
        if self.content_preferences is None:
            self.content_preferences = []
        if self.values is None:
            self.values = []
        if self.product_affinities is None:
            self.product_affinities = []
    
    def to_dict(self) -> dict:
        return asdict(self)


class XApiClient:
    """Client for X (Twitter) API to fetch user data."""
    
    BASE_URL = "https://api.twitter.com/2"
    
    def __init__(
        self,
        consumer_key: Optional[str] = None,
        consumer_secret: Optional[str] = None,
        access_token: Optional[str] = None,
        access_token_secret: Optional[str] = None
    ):
        """
        Initialize the X API client.
        
        Args:
            consumer_key: X API consumer key
            consumer_secret: X API consumer secret
            access_token: X API access token
            access_token_secret: X API access token secret
        """
        self.consumer_key = consumer_key or os.getenv('X_CONSUMER_KEY')
        self.consumer_secret = consumer_secret or os.getenv('X_CONSUMER_SECRET')
        self.access_token = access_token or os.getenv('X_ACCESS_TOKEN')
        self.access_token_secret = access_token_secret or os.getenv('X_ACCESS_TOKEN_SECRET')
        
        self._auth = None
        self._authenticated = False
        
        # Check if we have credentials
        if all([self.consumer_key, self.consumer_secret, self.access_token, self.access_token_secret]):
            self._auth = OAuth1(
                self.consumer_key,
                self.consumer_secret,
                self.access_token,
                self.access_token_secret
            )
            self._authenticated = True
    
    @property
    def is_authenticated(self) -> bool:
        """Check if client has valid credentials."""
        return self._authenticated
    
    def get_user_data_from_x(self, username: Optional[str] = None) -> Optional[dict]:
        """
        Fetch raw user data from X API.
        
        Args:
            username: X username to fetch (without @). If None, fetches authenticated user.
            
        Returns:
            Dict with X API data or None if unavailable
        """
        if not self._authenticated:
            return None
        
        try:
            if username:
                user_data = self._fetch_user_by_username(username)
            else:
                user_data = self._fetch_authenticated_user()
            
            if not user_data:
                return None
            
            user_id = user_data.get("id")
            
            # Fetch additional data
            interests = set()
            
            # From bio/description
            description = user_data.get("description", "")
            entities = user_data.get("entities", {}).get("description", {})
            for hashtag in entities.get("hashtags", []):
                interests.add(hashtag.get("tag", "").lower())
            
            # Fetch tweets and likes to analyze interests
            try:
                tweets = self._fetch_user_tweets(user_id, max_results=50)
                for tweet in tweets:
                    # Extract context annotations (topics)
                    for annotation in tweet.get("context_annotations", []):
                        domain = annotation.get("domain", {}).get("name", "")
                        entity = annotation.get("entity", {}).get("name", "")
                        if domain:
                            interests.add(domain.lower())
                        if entity:
                            interests.add(entity.lower())
                    
                    # Extract hashtags
                    entities = tweet.get("entities", {})
                    for hashtag in entities.get("hashtags", []):
                        interests.add(hashtag.get("tag", "").lower())
            except Exception as e:
                print(f"Error fetching tweets: {e}")
            
            return {
                "user_id": user_id,
                "username": user_data.get("username"),
                "interests": list(interests)[:20],
                "demographics": {
                    "location": user_data.get("location", ""),
                    "account_age": user_data.get("created_at", "")
                },
                "description": description
            }
        except Exception as e:
            print(f"X API error: {e}")
            return None
    
    def _fetch_authenticated_user(self) -> Optional[dict]:
        """Fetch the authenticated user's data."""
        url = f"{self.BASE_URL}/users/me"
        params = {
            "user.fields": "description,public_metrics,created_at,location,entities"
        }
        
        response = requests.get(url, auth=self._auth, params=params)
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"X API error: {response.status_code} - {response.text}")
            return None
    
    def _fetch_user_by_username(self, username: str) -> Optional[dict]:
        """Fetch a user by username."""
        url = f"{self.BASE_URL}/users/by/username/{username}"
        params = {
            "user.fields": "description,public_metrics,created_at,location,entities"
        }
        
        response = requests.get(url, auth=self._auth, params=params)
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"X API error: {response.status_code} - {response.text}")
            return None
    
    def _fetch_user_tweets(self, user_id: str, max_results: int = 100) -> list:
        """Fetch recent tweets from a user to analyze interests."""
        url = f"{self.BASE_URL}/users/{user_id}/tweets"
        params = {
            "max_results": min(max_results, 100),
            "tweet.fields": "entities,context_annotations,public_metrics"
        }
        
        response = requests.get(url, auth=self._auth, params=params)
        
        if response.status_code == 200:
            return response.json().get("data", [])
        return []
    
    def _fetch_user_likes(self, user_id: str, max_results: int = 100) -> list:
        """Fetch user's liked tweets to understand preferences."""
        url = f"{self.BASE_URL}/users/{user_id}/liked_tweets"
        params = {
            "max_results": min(max_results, 100),
            "tweet.fields": "entities,context_annotations"
        }
        
        response = requests.get(url, auth=self._auth, params=params)
        
        if response.status_code == 200:
            return response.json().get("data", [])
        return []


def get_enriched_user_profile(
    platform_data: dict,
    x_username: Optional[str] = None,
    grok_client=None
) -> dict:
    """
    Get enriched user profile by combining platform data with X API data and Grok analysis.
    NO FALLBACKS - always uses Grok API for analysis.
    
    Args:
        platform_data: Dict with platform data:
            - age: User age (optional)
            - shows: List of shows/content they watch (optional)
            - cookies: Cookie data (browsing history, preferences) (optional)
            - location: User location (optional)
            - interests: Any known interests (optional)
        x_username: Optional X username to fetch data from
        grok_client: Optional GrokClient instance (creates one if not provided)
    
    Returns:
        Enriched user profile dict with interests, demographics, product affinities
    """
    from grok_client import GrokClient
    
    if grok_client is None:
        grok_client = GrokClient()
    
    # Fetch X API data if username provided
    x_api_data = None
    x_client = XApiClient()
    if x_username and x_client.is_authenticated:
        print(f"Fetching data from X API for @{x_username}...")
        x_api_data = x_client.get_user_data_from_x(x_username)
        if x_api_data:
            print(f"  Found {len(x_api_data.get('interests', []))} interests from X")
    elif x_username:
        print(f"X API not authenticated, skipping X data fetch for @{x_username}")
    
    # Always use Grok to analyze and infer demographics
    print("Analyzing user data with Grok AI...")
    try:
        enriched_profile = grok_client.analyze_user_demographics(
            platform_data=platform_data,
            x_api_data=x_api_data
        )
        print(f"  Inferred segment: {enriched_profile.get('demographics', {}).get('segment')}")
        print(f"  Interests: {len(enriched_profile.get('interests', []))} inferred")
        return enriched_profile
    except Exception as e:
        raise RuntimeError(
            f"Failed to analyze user demographics with Grok: {e}. "
            "Grok API is required - no fallback available."
        )


def match_user_to_products(
    user_profile: dict,
    available_products: list[dict],
    grok_client=None
) -> dict:
    """
    Match user profile to best products/companies for ad placement.
    Uses Grok AI for intelligent matching.
    
    Args:
        user_profile: Enriched user profile from get_enriched_user_profile
        available_products: List of product dicts with company, product, category
        grok_client: Optional GrokClient instance
    
    Returns:
        Dict with matched products and best match
    """
    from grok_client import GrokClient
    
    if grok_client is None:
        grok_client = GrokClient()
    
    print(f"Matching user to {len(available_products)} products with Grok AI...")
    try:
        matches = grok_client.match_user_to_products(
            user_profile=user_profile,
            available_products=available_products
        )
        best_match = matches.get('best_match', {})
        if best_match:
            product = best_match.get('product', {})
            print(f"  Best match: {product.get('product')} by {product.get('company')} "
                  f"(relevance: {best_match.get('relevance_score', 0):.2f})")
        return matches
    except Exception as e:
        raise RuntimeError(
            f"Failed to match user to products with Grok: {e}. "
            "Grok API is required - no fallback available."
        )


if __name__ == "__main__":
    # Test the client
    print("Testing X API Client with Grok Analysis...")
    print("=" * 60)
    
    from grok_client import GrokClient
    
    # Test with platform data
    platform_data = {
        "age": 28,
        "shows": ["South Park", "Rick and Morty", "The Office"],
        "location": "US",
        "cookies": {
            "visited_sites": ["reddit.com", "youtube.com", "github.com"],
            "interests": ["technology", "comedy"]
        }
    }
    
    print("\nPlatform Data:")
    print(json.dumps(platform_data, indent=2))
    
    # Get enriched profile
    grok = GrokClient()
    try:
        profile = get_enriched_user_profile(
            platform_data=platform_data,
            grok_client=grok
        )
        print("\nEnriched Profile from Grok:")
        print(json.dumps(profile, indent=2))
        
        # Test product matching
        products = [
            {"company": "Tesla", "product": "Model 3", "category": "automotive"},
            {"company": "Apple", "product": "iPhone 15", "category": "electronics"},
            {"company": "Nike", "product": "Air Max", "category": "footwear"}
        ]
        
        matches = match_user_to_products(profile, products, grok)
        print("\nProduct Matches:")
        print(json.dumps(matches, indent=2))
    except Exception as e:
        print(f"Error: {e}")

