"""
WaveSpeed AI Client for Video Generation

Uses Wan 2.5 video-to-video model to generate AI-edited video segments
with product placement and ad integration.

Requirements:
    pip install requests python-dotenv
"""

import os
import json
import time
import requests
from requests.exceptions import RequestException, ConnectionError, Timeout
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Path to prompt template
PROMPT_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), 'prompts', 'ad_generation_template.txt')


class WaveSpeedClient:
    """Client for WaveSpeed AI video generation API."""
    
    BASE_URL = "https://api.wavespeed.ai/api/v3"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the WaveSpeed client.
        
        Args:
            api_key: WaveSpeed API key. If not provided, looks for WAVESPEED_API_KEY env var.
        """
        self.api_key = api_key or os.getenv('WAVESPEED_API_KEY')
        if not self.api_key:
            raise ValueError(
                "WaveSpeed API key not found. Set WAVESPEED_API_KEY environment variable "
                "or pass api_key parameter."
            )
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        
        # Load prompt template
        self.prompt_template = self._load_prompt_template()
    
    def _load_prompt_template(self) -> str:
        """Load the ad generation prompt template."""
        if os.path.exists(PROMPT_TEMPLATE_PATH):
            with open(PROMPT_TEMPLATE_PATH, 'r') as f:
                return f.read()
        else:
            # Fallback simple prompt
            return "Seamlessly integrate {product_name} by {company} into this video scene. {summary_before} The product should appear naturally. {summary_after}"
    
    def build_prompt(
        self,
        product_info: dict,
        summary_before: str,
        summary_after: str,
        user_data: Optional[dict] = None,
        content_type: str = "TV Show",
        content_genre: str = "Comedy",
        clip_duration: float = 20.0
    ) -> str:
        """
        Build the generation prompt from template and context.
        
        Args:
            product_info: Dict with company, product, category
            summary_before: What happens before this clip
            summary_after: What happens after this clip
            user_data: Optional user preferences/demographics
            content_type: Type of content (Movie, TV Show, etc.)
            content_genre: Genre of content
            clip_duration: Duration of the clip in seconds
            
        Returns:
            Formatted prompt string
        """
        user_data = user_data or {}
        
        prompt = self.prompt_template.format(
            content_type=content_type,
            content_genre=content_genre,
            clip_duration=f"{clip_duration:.1f}",
            summary_before=summary_before or "Scene in progress.",
            summary_after=summary_after or "Scene continues.",
            company=product_info.get('company', 'the brand'),
            product_name=product_info.get('product', 'the product'),
            product_category=product_info.get('category', 'consumer product'),
            user_interests=', '.join(user_data.get('interests', ['general audience'])),
            user_demographics=json.dumps(user_data.get('demographics', {}))
        )
        
        return prompt
    
    def generate_video(
        self,
        video_url: str,
        prompt: str,
        duration: int = 10,
        resolution: str = "720p",
        negative_prompt: str = "",
        enable_prompt_expansion: bool = False,
        seed: int = -1,
        poll_interval: float = 5.0,
        timeout: float = 600.0
    ) -> dict:
        """
        Generate an AI-edited video using Wan 2.5 video-to-video model.
        
        Args:
            video_url: URL to the source video
            prompt: Generation prompt
            duration: Target duration in seconds (3-10, default 10)
            resolution: Output resolution (480p, 720p, 1080p)
            negative_prompt: Things to avoid in generation
            enable_prompt_expansion: Let AI expand the prompt
            seed: Random seed (-1 for random)
            poll_interval: Seconds between status checks
            timeout: Maximum wait time in seconds
            
        Returns:
            Dict with status and output URL
        """
        url = f"{self.BASE_URL}/alibaba/wan-2.5/video-extend"
        
        # WaveSpeed only accepts duration 3-10, always use 10 for max output
        duration = 10
        
        payload = {
            "duration": duration,
            "enable_prompt_expansion": enable_prompt_expansion,
            "negative_prompt": negative_prompt,
            "prompt": prompt,
            "resolution": resolution,
            "seed": seed,
            "video": video_url
        }
        
        print(f"Submitting video generation task...")
        print(f"Video URL: {video_url}")
        print(f"Prompt: {prompt[:200]}...")
        
        begin = time.time()
        
        response = requests.post(url, headers=self.headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            raise RuntimeError(f"WaveSpeed API error: {response.status_code}, {response.text}")
        
        result = response.json()["data"]
        request_id = result["id"]
        print(f"Task submitted. Request ID: {request_id}")
        
        # Poll for results
        return self._poll_for_result(request_id, begin, poll_interval, timeout)
    
    def _poll_for_result(
        self,
        request_id: str,
        start_time: float,
        poll_interval: float,
        timeout: float
    ) -> dict:
        """Poll for task completion with robust retry logic."""
        url = f"{self.BASE_URL}/predictions/{request_id}/result"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        consecutive_errors = 0
        max_consecutive_errors = 10  # More retries for video gen
        
        print(f"Polling for results (this may take 1-3 minutes)...")
        
        while True:
            elapsed = time.time() - start_time
            
            if elapsed > timeout:
                raise TimeoutError(f"Video generation timed out after {timeout} seconds")
            
            try:
                response = requests.get(url, headers=headers, timeout=60)
                
                if response.status_code != 200:
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        raise RuntimeError(f"Status check failed after {max_consecutive_errors} retries: {response.status_code}, {response.text}")
                    print(f"Status check error ({consecutive_errors}/{max_consecutive_errors}), retrying in {poll_interval * 2}s...")
                    time.sleep(poll_interval * 2)
                    continue
                
                result = response.json()["data"]
                status = result["status"]
                consecutive_errors = 0  # Reset on success
                
                if status == "completed":
                    output_url = result["outputs"][0]
                    print(f"Task completed in {elapsed:.1f} seconds.")
                    print(f"Output URL: {output_url}")
                    return {
                        "status": "completed",
                        "output_url": output_url,
                        "duration": elapsed,
                        "request_id": request_id
                    }
                
                elif status == "failed":
                    error = result.get('error', 'Unknown error')
                    raise RuntimeError(f"Video generation failed: {error}")
                
                else:
                    print(f"Status: {status} ({elapsed:.1f}s elapsed)")
                
            except (RequestException, ConnectionError, Timeout, Exception) as e:
                # Catch ALL exceptions during polling - video gen can take minutes
                consecutive_errors += 1
                if consecutive_errors >= max_consecutive_errors:
                    raise RuntimeError(f"Connection failed after {max_consecutive_errors} retries: {e}")
                print(f"Connection error ({consecutive_errors}/{max_consecutive_errors}): {type(e).__name__}, retrying in {poll_interval * 2}s...")
                time.sleep(poll_interval * 2)
                continue
            
            time.sleep(poll_interval)
    
    def download_video(self, url: str, output_path: str) -> str:
        """
        Download a video from URL to local file.
        
        Args:
            url: Video URL
            output_path: Local file path
            
        Returns:
            Path to downloaded file
        """
        print(f"Downloading video to: {output_path}")
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded successfully: {output_path}")
        return output_path


def upload_to_temp_hosting(file_path: str) -> str:
    """
    Upload a file to temporary hosting to get a public URL.
    
    Tries multiple services for reliability.
    In production, use S3, GCS, or similar.
    
    Args:
        file_path: Local file path
        
    Returns:
        Public URL to the file
    """
    print(f"Uploading {file_path} to temporary hosting...")
    
    file_size = os.path.getsize(file_path)
    print(f"File size: {file_size / (1024*1024):.2f} MB")
    
    # Try multiple hosting services
    errors = []
    
    # Option 1: catbox.moe (primary - good for video files)
    try:
        print("Trying catbox.moe...")
        with open(file_path, 'rb') as f:
            response = requests.post(
                'https://catbox.moe/user/api.php',
                data={'reqtype': 'fileupload'},
                files={'fileToUpload': f},
                timeout=120
            )
        if response.status_code == 200 and response.text.startswith('http'):
            url = response.text.strip()
            print(f"Uploaded successfully to catbox.moe: {url}")
            return url
        errors.append(f"catbox.moe: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        errors.append(f"catbox.moe: {str(e)}")
    
    # Option 2: 0x0.st (fallback)
    try:
        print("Trying 0x0.st...")
        with open(file_path, 'rb') as f:
            response = requests.post(
                'https://0x0.st',
                files={'file': f},
                timeout=120
            )
        if response.status_code == 200:
            url = response.text.strip()
            print(f"Uploaded successfully to 0x0.st: {url}")
            return url
        errors.append(f"0x0.st: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        errors.append(f"0x0.st: {str(e)}")
    
    # Option 3: file.io (last fallback)
    try:
        print("Trying file.io...")
        with open(file_path, 'rb') as f:
            response = requests.post(
                'https://file.io',
                files={'file': f},
                timeout=120
            )
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('success'):
                    url = result['link']
                    print(f"Uploaded successfully to file.io: {url}")
                    return url
            except:
                pass
        errors.append(f"file.io: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        errors.append(f"file.io: {str(e)}")
    
    # All services failed
    error_msg = "All upload services failed:\n" + "\n".join(f"  - {e}" for e in errors)
    raise RuntimeError(error_msg)


if __name__ == "__main__":
    # Test the client
    client = WaveSpeedClient()
    
    # Test prompt building
    prompt = client.build_prompt(
        product_info={"company": "Tesla", "product": "Model 3", "category": "automotive"},
        summary_before="The characters are discussing their daily commute frustrations.",
        summary_after="They continue talking about how things have changed.",
        user_data={"interests": ["tech", "cars"], "demographics": {"age_group": "25-34"}},
        content_type="TV Show",
        content_genre="Comedy",
        clip_duration=20.0
    )
    
    print("Generated Prompt:")
    print("=" * 60)
    print(prompt)
    print("=" * 60)

