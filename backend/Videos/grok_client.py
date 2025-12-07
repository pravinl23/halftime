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


if __name__ == "__main__":
    # Quick test
    client = GrokClient()
    
    response = client.chat([
        {"role": "user", "content": "Say 'Grok API is working!' and nothing else."}
    ])
    print(f"Grok response: {response}")

