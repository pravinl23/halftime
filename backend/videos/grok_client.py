"""
Grok API Client for XAI's Grok model.

Simple wrapper for making API calls to Grok for ad placement analysis.
"""

import os
import json
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv


# Load environment variables from Videos folder .env (or project root)
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))  # Videos folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))  # Fallback to halftime/


class GrokClient:
    """Client for interacting with the Grok API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Grok client.
        
        Args:
            api_key: XAI API key. If not provided, will look for XAI_API_KEY env var.
        """
        self.api_key = api_key or os.getenv('XAI_API_KEY')
        if not self.api_key:
            raise ValueError(
                "XAI API key not found. Set XAI_API_KEY environment variable "
                "or pass api_key parameter."
            )
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.x.ai/v1"
        )
        self.model = "grok-4-1-fast"
    
    def chat(
        self, 
        messages: list[dict], 
        temperature: float = 0.7,
        max_tokens: int = 4096,
        json_response: bool = False
    ) -> str:
        """
        Send a chat completion request to Grok.
        
        Args:
            messages: List of message dicts with 'role' and 'content'.
            temperature: Sampling temperature (0-2). Default 0.7.
            max_tokens: Maximum tokens in response. Default 4096.
            json_response: If True, request JSON formatted response.
            
        Returns:
            The assistant's response text.
        """
        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if json_response:
            kwargs["response_format"] = {"type": "json_object"}
        
        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    
    def analyze_ad_placement(
        self,
        transcript_summary: str,
        gaps: list[dict],
        user_data: dict,
        product_info: dict,
        buffer_seconds: int = 10
    ) -> dict:
        """
        Analyze transcript and find the single optimal ad placement timestamp.
        
        Args:
            transcript_summary: Summary of the transcript with timestamps.
            gaps: List of detected gaps in dialogue.
            user_data: User preferences/interests from X API.
            product_info: Information about the product being advertised.
            buffer_seconds: Buffer before/after the ad insertion point (default 10s).
            
        Returns:
            Dict with the optimal ad placement and context summaries.
        """
        system_prompt = """You are an expert ad placement analyst. Your job is to find THE perfect moment in video content to insert an advertisement that feels natural and non-disruptive.

You will analyze:
1. Transcript content with timestamps - to understand context and find thematic connections
2. Dialogue gaps - natural pauses that could accommodate ads
3. User preferences - to personalize placement timing based on interests
4. Product information - to find contextually relevant moments

Your goal is to identify the SINGLE BEST moment where an ad would feel like a natural part of the viewing experience, not an interruption. You must also provide detailed summaries of what happens before and after this moment so the ad can be seamlessly integrated.

IMPORTANT: You must respond with valid JSON only."""

        user_prompt = f"""Analyze this video content and find the SINGLE BEST timestamp for ad placement.

## Product to Advertise
Company: {product_info.get('company', 'Unknown')}
Product: {product_info.get('product', 'Unknown')}
Category: {product_info.get('category', 'Unknown')}

## User Preferences (from X/Twitter)
Interests: {', '.join(user_data.get('interests', []))}
Demographics: {json.dumps(user_data.get('demographics', {}))}

## Detected Dialogue Gaps (potential ad slots)
{self._format_gaps(gaps)}

## Transcript Summary
{transcript_summary}

## Instructions
Find the SINGLE BEST timestamp for ad placement. Consider:
1. Natural pauses in dialogue (gaps) - ads here won't interrupt speech
2. Scene transitions or topic changes - natural break points
3. Contextual relevance - moments that thematically connect to the product
4. User interests - prioritize moments related to what the user likes
5. Emotional pacing - avoid tense/climactic moments, prefer calm transitions

The selected clip will have a {buffer_seconds}-second buffer before and after for editing context.

Respond with this exact JSON structure:
{{
    "placement": {{
        "insertion_point": "HH:MM:SS,mmm",
        "buffer_start": "HH:MM:SS,mmm",
        "buffer_end": "HH:MM:SS,mmm",
        "confidence": 0.0 to 1.0,
        "reason": "Detailed explanation of why this is the perfect placement",
        "context_relevance": "How this moment relates to the product/user interests",
        "summary_before": "Detailed summary of what happens in the ~10 seconds BEFORE the insertion point (what scene/dialogue is ending)",
        "summary_after": "Detailed summary of what happens in the ~10 seconds AFTER the insertion point (what scene/dialogue is starting)"
    }},
    "overall_analysis": "Brief summary of the content and why this placement was chosen over others"
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = self.chat(messages, temperature=0.3, json_response=True)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse Grok response as JSON: {response[:500]}")
    
    def _format_gaps(self, gaps: list[dict]) -> str:
        """Format gaps list for the prompt."""
        lines = []
        for i, gap in enumerate(gaps[:15], 1):  # Limit to top 15 gaps
            lines.append(
                f"{i}. [{gap['start_time']} - {gap['end_time']}] "
                f"Duration: {gap['duration']:.2f}s"
            )
            if gap.get('context_before'):
                lines.append(f"   Before: ...{gap['context_before'][-80:]}")
            if gap.get('context_after'):
                lines.append(f"   After: {gap['context_after'][:80]}...")
        return '\n'.join(lines)

    def analyze_user_demographics(
        self,
        platform_data: dict,
        x_api_data: Optional[dict] = None
    ) -> dict:
        """
        Analyze user data from platform and X API to infer demographics, interests, and preferences.
        Uses Grok AI to make intelligent assumptions when data is incomplete.
        
        Args:
            platform_data: Dict with platform data:
                - age: User age (optional)
                - shows: List of shows/content they watch (optional)
                - cookies: Cookie data (browsing history, preferences) (optional)
                - location: User location (optional)
                - any other platform-specific data
            x_api_data: Optional dict with X API data:
                - interests: List of interests from X
                - tweets: Sample tweets (optional)
                - likes: Liked content (optional)
                - demographics: Any demographic data from X
        
        Returns:
            Dict with enriched user profile:
            {
                "interests": [...],
                "demographics": {
                    "age_range": "...",
                    "segment": "...",
                    "location": "...",
                    ...
                },
                "content_preferences": [...],
                "values": [...],
                "product_affinities": [...],
                "inferred_from": "description of what data was used"
            }
        """
        system_prompt = """You are an expert demographic and psychographic analyst. Your job is to analyze incomplete user data and make intelligent inferences about their demographics, interests, values, and product preferences.

You will receive:
1. Platform data (age, shows watched, cookies/browsing data, location)
2. X API data (interests, tweets, likes, demographics)

Your task is to:
- Infer demographic segment (gen_z, millennial, gen_x, boomer, or psychographic segments like tech_enthusiast, entertainment_fan)
- Identify interests and preferences even when data is sparse
- Determine what types of products/services this user would be interested in
- Infer values and content preferences
- Make reasonable assumptions based on available data patterns

IMPORTANT: Always respond with valid JSON only. Make inferences even with minimal data - that's your value."""
        
        user_prompt = f"""Analyze this user data and provide a comprehensive demographic and psychographic profile.

## Platform Data
{json.dumps(platform_data, indent=2)}

## X API Data
{json.dumps(x_api_data or {}, indent=2)}

## Your Task
Based on the available data (even if sparse), infer:
1. Demographic segment (age-based or psychographic)
2. Interests and hobbies
3. Content preferences (what they like to watch/consume)
4. Values and priorities
5. Product affinities (what types of products/services they'd be interested in)
6. Any other relevant psychographic traits

Make intelligent assumptions. For example:
- If they watch tech shows and are 25-35, likely tech_enthusiast segment
- If they watch comedy shows and are 18-25, likely gen_z with entertainment preferences
- Combine age + shows + interests to infer deeper preferences

Respond with this exact JSON structure:
{{
    "interests": ["list", "of", "inferred", "interests"],
    "demographics": {{
        "age_range": "inferred age range",
        "segment": "demographic or psychographic segment name",
        "location": "inferred or provided location",
        "confidence": 0.0 to 1.0
    }},
    "content_preferences": ["types", "of", "content", "they", "prefer"],
    "values": ["values", "and", "priorities"],
    "product_affinities": ["types", "of", "products", "they'd", "be", "interested", "in"],
    "inferred_from": "Description of what data was available and what assumptions were made"
}}"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = self.chat(messages, temperature=0.5, json_response=True, max_tokens=2048)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse Grok response as JSON: {response[:500]}")
    
    def match_user_to_products(
        self,
        user_profile: dict,
        available_products: list[dict]
    ) -> dict:
        """
        Match a user profile to the best products/companies for ad placement.
        Uses Grok to analyze compatibility and relevance.
        
        Args:
            user_profile: Enriched user profile from analyze_user_demographics
            available_products: List of product dicts with:
                - company: Company name
                - product: Product name
                - category: Product category
                - description: Optional product description
        
        Returns:
            Dict with matched products:
            {
                "matches": [
                    {
                        "product": {...},
                        "relevance_score": 0.0-1.0,
                        "reason": "Why this product matches",
                        "ad_style": "suggested ad style (subtle, contextual, etc.)"
                    }
                ],
                "best_match": {...},
                "analysis": "Overall analysis of matching"
            }
        """
        system_prompt = """You are an expert ad matching specialist. Your job is to match users with products/companies for personalized advertising.

Analyze user profiles and available products to determine:
- Which products are most relevant to the user
- Why they match (interests, demographics, values alignment)
- What style of ad would work best (subtle product placement, direct ad, contextual integration)

IMPORTANT: Always respond with valid JSON only."""
        
        user_prompt = f"""Match this user profile to available products for ad placement.

## User Profile
{json.dumps(user_profile, indent=2)}

## Available Products
{json.dumps(available_products, indent=2)}

## Your Task
For each product, determine:
1. Relevance score (0.0-1.0) - how well it matches the user
2. Reason for the match
3. Suggested ad style (subtle, contextual, transitional, direct)

Rank products by relevance and identify the best match.

Respond with this exact JSON structure:
{{
    "matches": [
        {{
            "product": {{"company": "...", "product": "...", "category": "..."}},
            "relevance_score": 0.0 to 1.0,
            "reason": "Why this product matches the user",
            "ad_style": "suggested ad integration style"
        }}
    ],
    "best_match": {{
        "product": {{"company": "...", "product": "...", "category": "..."}},
        "relevance_score": 0.0 to 1.0,
        "reason": "Why this is the best match",
        "ad_style": "suggested ad integration style"
    }},
    "analysis": "Overall analysis of user-product matching"
}}"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = self.chat(messages, temperature=0.4, json_response=True, max_tokens=2048)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse Grok response as JSON: {response[:500]}")

    def suggest_product(self, user_profile: dict) -> dict:
        """
        Suggest a single product/service to advertise based on user profile.
        Uses Grok to intelligently recommend products without a predefined list.
        
        Args:
            user_profile: Enriched user profile from analyze_user_demographics containing:
                - interests: List of user interests
                - demographics: Dict with age_range, segment, location
                - content_preferences: What content they consume
                - values: User values and priorities
                - product_affinities: Types of products they'd like
        
        Returns:
            Dict with product recommendation:
            {
                "product": "Product name",
                "company": "Company/brand name",
                "category": "Product category",
                "reason": "Why this product is perfect for this user",
                "confidence": 0.0-1.0,
                "ad_approach": "How to present this ad to the user"
            }
        """
        system_prompt = """You are an expert advertising strategist. Your job is to suggest THE perfect product or service to advertise to a specific user based on their demographic profile, interests, and preferences.

You will receive a detailed user profile and must suggest ONE specific, real product/service that would resonate most with this person.

Guidelines:
- Suggest real products/brands that exist (e.g., "Gymshark Lifting Straps", "Apple AirPods Pro", "Nike Air Max")
- Be specific - don't just say "fitness equipment", say the exact product
- Consider the user's age, interests, values, and content preferences
- Think about what would genuinely appeal to this person, not just generic ads
- The product should feel like a natural fit, not a forced recommendation

IMPORTANT: Always respond with valid JSON only."""

        user_prompt = f"""Based on this user profile, suggest THE ONE perfect product to advertise to them.

## User Profile
{json.dumps(user_profile, indent=2)}

## Your Task
Analyze this user's demographics, interests, values, and preferences to suggest ONE specific product/service that would genuinely appeal to them.

Think about:
- What problems might they have that a product could solve?
- What aspirations do they have?
- What brands align with their values?
- What would they actually want to buy?

Respond with this exact JSON structure:
{{
    "product": "Specific product name (e.g., 'Lifting Straps', 'AirPods Pro 2')",
    "company": "Brand/company name (e.g., 'Gymshark', 'Apple')",
    "category": "Product category (e.g., 'Fitness Accessories', 'Electronics')",
    "reason": "Detailed explanation of why this product is perfect for this user based on their profile",
    "confidence": 0.0 to 1.0,
    "ad_approach": "How to present this ad (e.g., 'Show during workout content, emphasize performance gains')"
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = self.chat(messages, temperature=0.6, json_response=True, max_tokens=1024)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse Grok response as JSON: {response[:500]}")


if __name__ == "__main__":
    # Quick test
    client = GrokClient()
    
    response = client.chat([
        {"role": "user", "content": "Say 'Grok API is working!' and nothing else."}
    ])
    print(f"Grok response: {response}")

