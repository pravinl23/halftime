"""Test WaveSpeed API with their exact example"""

import os
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

def main():
    print("Testing WaveSpeed API with their example...")
    
    API_KEY = os.getenv("WAVESPEED_API_KEY")
    print(f"API_KEY: {API_KEY[:20]}..." if API_KEY else "API_KEY: NOT FOUND")
    
    if not API_KEY:
        print("ERROR: No API key found!")
        return
    
    url = "https://api.wavespeed.ai/api/v3/alibaba/wan-2.5/video-extend"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    
    # Test with our catbox video to see if that works
    payload = {
        "duration": 10,
        "enable_prompt_expansion": False,
        "negative_prompt": "",
        "prompt": "A Tesla Model 3 car smoothly drives into the scene. The car looks sleek and modern.",
        "resolution": "720p",
        "seed": -1,
        "video": "https://files.catbox.moe/30nct7.mp4"  # Our uploaded video
    }
    
    print(f"\nSubmitting task...")
    print(f"Video URL: {payload['video']}")
    print(f"Prompt: {payload['prompt']}")
    
    begin = time.time()
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 200:
        result = response.json()["data"]
        request_id = result["id"]
        print(f"Task submitted successfully. Request ID: {request_id}")
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return
    
    url = f"https://api.wavespeed.ai/api/v3/predictions/{request_id}/result"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    # Poll for results
    print("\nPolling for results...")
    while True:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()["data"]
            status = result["status"]
            
            if status == "completed":
                end = time.time()
                print(f"\nTask completed in {end - begin:.1f} seconds.")
                output_url = result["outputs"][0]
                print(f"Output URL: {output_url}")
                break
            elif status == "failed":
                print(f"\nTask failed: {result.get('error')}")
                break
            else:
                elapsed = time.time() - begin
                print(f"Status: {status} ({elapsed:.1f}s elapsed)")
        else:
            print(f"Error: {response.status_code}, {response.text}")
            break
        
        time.sleep(0.5)

if __name__ == "__main__":
    main()

