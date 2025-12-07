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
    
    def find_candidate_placements(
        self,
        transcript_summary: str,
        gaps: list[dict],
        user_data: dict,
        product_info: dict,
        num_candidates: int = 5,
        buffer_before: int = 10,
        buffer_after: int = 3
    ) -> dict:
        """
        PASS 1: Find multiple candidate timestamps from transcript analysis.
        
        Args:
            transcript_summary: Summary of the transcript with timestamps.
            gaps: List of detected gaps in dialogue.
            user_data: User preferences/interests from X API.
            product_info: Information about the product being advertised.
            num_candidates: Number of candidates to return.
            buffer_before: Seconds before insertion point (default 10).
            buffer_after: Seconds after insertion point (default 3).
            
        Returns:
            Dict with list of candidate placements.
        """
        system_prompt = """You are an expert ad placement analyst. Your job is to find the best moments in video content to insert advertisements.

You will analyze transcript content and dialogue gaps to find MULTIPLE candidate timestamps where an ad could naturally fit.

IMPORTANT: You must respond with valid JSON only."""

        user_prompt = f"""Analyze this video content and find the {num_candidates} BEST candidate timestamps for ad placement.

## Product to Advertise
Company: {product_info.get('company', 'Unknown')}
Product: {product_info.get('product', 'Unknown')}
Category: {product_info.get('category', 'Unknown')}

## User Preferences
Interests: {', '.join(user_data.get('interests', []))}

## Detected Dialogue Gaps (potential ad slots)
{self._format_gaps(gaps)}

## Transcript Summary
{transcript_summary}

## Instructions
Find {num_candidates} candidate timestamps ranked by quality. Consider:
1. Natural pauses in dialogue (gaps)
2. Scene transitions or topic changes
3. Contextual relevance to {product_info.get('product', 'the product')}
4. Emotional pacing - avoid tense moments

Respond with this exact JSON structure:
{{
    "candidates": [
        {{
            "rank": 1,
            "insertion_point": "HH:MM:SS,mmm",
            "buffer_start": "HH:MM:SS,mmm",
            "buffer_end": "HH:MM:SS,mmm",
            "reason": "Why this spot is good based on TRANSCRIPT context",
            "transcript_context": "What is being said/happening according to transcript"
        }}
    ]
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = self.chat(messages, temperature=0.3, json_response=True)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse Grok response as JSON: {response[:500]}")
    
    def select_best_placement_from_frames(
        self,
        frames_data: list[dict],
        product_info: dict,
        user_data: dict
    ) -> dict:
        """
        PASS 2: Use Grok Vision to analyze frames and select the best placement.
        
        Args:
            frames_data: List of dicts with 'timestamp', 'reason', 'frame_base64'
            product_info: Product information
            user_data: User preferences
            
        Returns:
            Dict with the selected best placement
        """
        # Build content with images
        content = []
        
        product = product_info.get('product', 'product')
        category = product_info.get('category', 'general')
        
        # Add text instruction
        content.append({
            "type": "text",
            "text": f"""You are selecting the BEST ad placement for {product} by {product_info.get('company', 'company')}.

Product Category: {category}

I'm showing you {len(frames_data)} candidate frames from a video. Each frame is a potential spot to insert an ad.

## YOUR TASK:
Think about HOW this specific product ({product}) would naturally appear in a video scene. Then pick the frame where it would look MOST NATURAL and LEAST FORCED.

## KEY QUESTIONS FOR EACH FRAME:

1. **Could this product realistically appear here?**
   - Think about what this product IS and how people USE it
   - A wearable needs someone to wear it
   - A drink needs someone to drink it
   - A car needs a road or parking area
   - etc.

2. **Is there something/someone in the frame to INTERACT with the product?**
   - Empty scenes are BAD - there's nothing for the product to relate to
   - Scenes with PEOPLE are usually BETTER - products are made for people
   
3. **Is this a TRANSITION/ESTABLISHING shot?**
   - Exterior building shots, cityscapes, aerial views = REJECT THESE
   - These have no interaction context - product would just float awkwardly

4. **Would the product placement look NATURAL or FORCED?**
   - Natural: Product fits the scene's context and mood
   - Forced: Product appears randomly with no logical reason to be there

Here are the candidates:
"""
        })
        
        # Add each frame with its context
        for i, frame in enumerate(frames_data):
            content.append({
                "type": "text",
                "text": f"\n--- Candidate {i+1} (Timestamp: {frame['timestamp']}) ---\nTranscript reason: {frame.get('reason', 'N/A')}\n"
            })
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{frame['frame_base64']}"
                }
            })
        
        content.append({
            "type": "text",
            "text": f"""

Now select the SINGLE BEST candidate for a {product} ad.

Think: "Where would {product} appear MOST NATURALLY in this video?"

Respond with JSON:
{{
    "selected_index": <0-based index of best candidate>,
    "timestamp": "<timestamp of selected candidate>",
    "visual_description": "What you see in the selected frame",
    "has_people": true/false,
    "is_transition_shot": true/false,
    "how_product_fits": "How would {product} naturally appear in this scene?",
    "why_selected": "Why this is the best frame for {product}",
    "why_others_rejected": "Why the other frames were worse choices"
}}"""
        })
        
        messages = [
            {
                "role": "user",
                "content": content
            }
        ]
        
        response = self.client.chat.completions.create(
            model="grok-2-vision-latest",
            messages=messages,
            temperature=0.3
        )
        
        response_text = response.choices[0].message.content
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse vision response: {response_text[:500]}")
    
    def analyze_ad_placement(
        self,
        transcript_summary: str,
        gaps: list[dict],
        user_data: dict,
        product_info: dict,
        buffer_before: int = 10,
        buffer_after: int = 3
    ) -> dict:
        """
        Legacy single-pass method. Kept for compatibility.
        For multi-pass, use find_candidate_placements + select_best_placement_from_frames.
        """
        # Just call find_candidate_placements and return the top one
        result = self.find_candidate_placements(
            transcript_summary, gaps, user_data, product_info, 
            num_candidates=1, buffer_before=buffer_before, buffer_after=buffer_after
        )
        
        if result.get("candidates"):
            candidate = result["candidates"][0]
            return {
                "placement": {
                    "insertion_point": candidate.get("insertion_point"),
                    "buffer_start": candidate.get("buffer_start"),
                    "buffer_end": candidate.get("buffer_end"),
                    "confidence": 0.8,
                    "reason": candidate.get("reason", ""),
                    "context_relevance": candidate.get("transcript_context", ""),
                    "summary_before": "",
                    "summary_after": ""
                },
                "overall_analysis": ""
            }
        raise ValueError("No candidates found")
    
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

