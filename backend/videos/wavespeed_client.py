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
        seed: int = -1
    ) -> dict:
        """
        Generate an AI-edited video using Wan 2.5 video-to-video model.
        Matches WaveSpeed example code exactly.
        """
        # Submit task
        url = "https://api.wavespeed.ai/api/v3/alibaba/wan-2.5/video-extend"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        
        payload = {
            "duration": 10,  # Always use 10 (max allowed)
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
        
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        
        if response.status_code == 200:
            result = response.json()["data"]
            request_id = result["id"]
            print(f"Task submitted successfully. Request ID: {request_id}")
        else:
            raise RuntimeError(f"Error: {response.status_code}, {response.text}")
        
        # Poll for results - EXACTLY like their example
        poll_url = f"https://api.wavespeed.ai/api/v3/predictions/{request_id}/result"
        poll_headers = {"Authorization": f"Bearer {self.api_key}"}
        
        print("Polling for results (this may take 1-2 minutes)...")
        
        while True:
            response = requests.get(poll_url, headers=poll_headers)
            
            if response.status_code == 200:
                result = response.json()["data"]
                status = result["status"]
                
                if status == "completed":
                    end = time.time()
                    output_url = result["outputs"][0]
                    print(f"\nTask completed in {end - begin:.1f} seconds.")
                    print(f"Output URL: {output_url}")
                    return {
                        "status": "completed",
                        "output_url": output_url,
                        "duration": end - begin,
                        "request_id": request_id
                    }
                elif status == "failed":
                    raise RuntimeError(f"Task failed: {result.get('error')}")
                else:
                    elapsed = time.time() - begin
                    print(f"Status: {status} ({elapsed:.1f}s elapsed)")
            else:
                raise RuntimeError(f"Error: {response.status_code}, {response.text}")
            
            time.sleep(0.5)
    
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
    
    Uses tmpfiles.org which provides direct download links that work with WaveSpeed.
    
    Args:
        file_path: Local file path
        
    Returns:
        Public URL to the file
    """
    print(f"Uploading {file_path} to temporary hosting...")
    
    file_size = os.path.getsize(file_path)
    print(f"File size: {file_size / (1024*1024):.2f} MB")
    
    errors = []
    
    # Option 1: tmpfiles.org - direct download links
    try:
        print("Trying tmpfiles.org...")
        with open(file_path, 'rb') as f:
            response = requests.post(
                'https://tmpfiles.org/api/v1/upload',
                files={'file': f},
                timeout=120
            )
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                # Convert view URL to direct download URL
                url = result['data']['url'].replace('tmpfiles.org/', 'tmpfiles.org/dl/')
                print(f"Uploaded successfully to tmpfiles.org: {url}")
                return url
        errors.append(f"tmpfiles.org: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        errors.append(f"tmpfiles.org: {str(e)}")
    
    # Option 2: litterbox.catbox.moe (1 hour expiry, more reliable)
    try:
        print("Trying litterbox (catbox 1h)...")
        with open(file_path, 'rb') as f:
            response = requests.post(
                'https://litterbox.catbox.moe/resources/internals/api.php',
                data={'reqtype': 'fileupload', 'time': '1h'},
                files={'fileToUpload': f},
                timeout=120
            )
        if response.status_code == 200 and response.text.startswith('http'):
            url = response.text.strip()
            print(f"Uploaded successfully to litterbox: {url}")
            return url
        errors.append(f"litterbox: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        errors.append(f"litterbox: {str(e)}")
    
    # Option 3: transfer.sh
    try:
        print("Trying transfer.sh...")
        filename = os.path.basename(file_path)
        with open(file_path, 'rb') as f:
            response = requests.put(
                f'https://transfer.sh/{filename}',
                data=f,
                timeout=120
            )
        if response.status_code == 200:
            url = response.text.strip()
            print(f"Uploaded successfully to transfer.sh: {url}")
            return url
        errors.append(f"transfer.sh: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        errors.append(f"transfer.sh: {str(e)}")
    
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

