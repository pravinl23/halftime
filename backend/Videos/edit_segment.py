"""
Video Segment Editor

Edits video segments using either:
1. AI Video Generation (WaveSpeed Wan 2.5) - for production ad integration
2. Placeholder effects (B&W + slow down) - for testing without API

Requirements:
    pip install moviepy numpy requests python-dotenv

Usage:
    python edit_segment.py <input_video> [output_video] [--ai]
    
    --ai: Use WaveSpeed AI for video generation (requires context JSON)
"""

import sys
import os
import subprocess
import json
from typing import Optional
from moviepy import VideoFileClip


def edit_segment_placeholder(input_path: str, output_path: str = None, speed_factor: float = 0.8) -> str:
    """
    Apply placeholder edits to a video segment (B&W + speed change).
    Used for testing when AI generation is not needed.
    
    Args:
        input_path: Path to input video file
        output_path: Path to output video file (optional)
        speed_factor: Speed multiplier (0.8 = slower/longer)
    
    Returns:
        Path to the output video file
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video file not found: {input_path}")
    
    if output_path is None:
        base_name = os.path.splitext(input_path)[0]
        ext = os.path.splitext(input_path)[1]
        output_path = f"{base_name}_edited{ext}"
    
    print(f"Loading video: {input_path}")
    
    clip = VideoFileClip(input_path)
    original_duration = clip.duration
    
    print(f"Original duration: {original_duration:.2f}s")
    print(f"Applying placeholder edits (B&W + speed {speed_factor})...")
    
    # Build ffmpeg command
    if speed_factor < 0.5:
        audio_filter = 'atempo=0.5,atempo=' + str(speed_factor / 0.5)
    elif speed_factor > 2.0:
        audio_filter = 'atempo=2.0,atempo=' + str(speed_factor / 2.0)
    else:
        audio_filter = f'atempo={speed_factor}'
    
    filter_complex = f'[0:v]setpts={1/speed_factor}*PTS,format=gray,format=yuv420p[v];[0:a]{audio_filter}[a]'
    
    ffmpeg_cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-filter_complex', filter_complex,
        '-map', '[v]', '-map', '[a]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-threads', '4',
        output_path
    ]
    
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    
    clip.close()
    
    processed = VideoFileClip(output_path)
    new_duration = processed.duration
    processed.close()
    
    print(f"New duration: {new_duration:.2f}s")
    print(f"Successfully edited (placeholder): {output_path}")
    
    return output_path


def edit_segment_ai(
    input_path: str,
    output_path: str = None,
    product_info: dict = None,
    summary_before: str = "",
    summary_after: str = "",
    user_data: dict = None,
    content_type: str = "TV Show",
    content_genre: str = "Comedy"
) -> str:
    """
    Edit video segment using WaveSpeed AI for ad integration.
    
    Args:
        input_path: Path to input video file
        output_path: Path to output video file (optional)
        product_info: Dict with company, product, category
        summary_before: What happens before this clip
        summary_after: What happens after this clip
        user_data: User preferences/demographics
        content_type: Type of content (Movie, TV Show, etc.)
        content_genre: Genre of content
    
    Returns:
        Path to the output video file
    """
    from wavespeed_client import WaveSpeedClient, upload_to_temp_hosting
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video file not found: {input_path}")
    
    if output_path is None:
        base_name = os.path.splitext(input_path)[0]
        ext = os.path.splitext(input_path)[1]
        output_path = f"{base_name}_ai_edited{ext}"
    
    product_info = product_info or {"company": "Brand", "product": "Product", "category": "general"}
    user_data = user_data or {"interests": ["general"], "demographics": {}}
    
    print(f"Loading video for AI editing: {input_path}")
    
    # Get clip duration
    clip = VideoFileClip(input_path)
    clip_duration = clip.duration
    clip.close()
    
    print(f"Clip duration: {clip_duration:.2f}s")
    print(f"Product: {product_info.get('product')} by {product_info.get('company')}")
    
    # Initialize WaveSpeed client
    client = WaveSpeedClient()
    
    # Build the prompt
    prompt = client.build_prompt(
        product_info=product_info,
        summary_before=summary_before,
        summary_after=summary_after,
        user_data=user_data,
        content_type=content_type,
        content_genre=content_genre,
        clip_duration=clip_duration
    )
    
    print("\n" + "=" * 60)
    print("AI GENERATION PROMPT")
    print("=" * 60)
    print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
    print("=" * 60 + "\n")
    
    # Upload video to get URL
    print("Uploading video to temporary hosting...")
    video_url = upload_to_temp_hosting(input_path)
    
    # Generate AI video
    print("Generating AI video...")
    result = client.generate_video(
        video_url=video_url,
        prompt=prompt,
        duration=int(clip_duration),
        resolution="720p"
    )
    
    # Download the result
    print("Downloading generated video...")
    client.download_video(result['output_url'], output_path)
    
    print(f"\nSuccessfully generated AI video: {output_path}")
    return output_path


def edit_segment(
    input_path: str,
    output_path: str = None,
    use_ai: bool = False,
    speed_factor: float = 0.8,
    context: dict = None
) -> str:
    """
    Edit a video segment - main entry point.
    
    Args:
        input_path: Path to input video file
        output_path: Path to output video file (optional)
        use_ai: Whether to use AI video generation
        speed_factor: Speed factor for placeholder mode
        context: Context dict for AI mode (product_info, summaries, etc.)
    
    Returns:
        Path to the output video file
    """
    if use_ai:
        context = context or {}
        return edit_segment_ai(
            input_path=input_path,
            output_path=output_path,
            product_info=context.get('product_info'),
            summary_before=context.get('summary_before', ''),
            summary_after=context.get('summary_after', ''),
            user_data=context.get('user_data'),
            content_type=context.get('content_type', 'TV Show'),
            content_genre=context.get('content_genre', 'Comedy')
        )
    else:
        return edit_segment_placeholder(input_path, output_path, speed_factor)


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nUsage:")
        print("  python edit_segment.py <input_video> [output_video] [speed_factor]")
        print("  python edit_segment.py <input_video> --ai --context context.json")
        print("\nExamples:")
        print("  python edit_segment.py clip.mp4")
        print("  python edit_segment.py clip.mp4 clip_edited.mp4 0.8")
        print("  python edit_segment.py clip.mp4 --ai --context ad_context.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    use_ai = '--ai' in sys.argv
    
    if use_ai:
        # AI mode - need context
        context = {}
        if '--context' in sys.argv:
            idx = sys.argv.index('--context')
            if idx + 1 < len(sys.argv):
                with open(sys.argv[idx + 1], 'r') as f:
                    context = json.load(f)
        
        output_path = None
        for i, arg in enumerate(sys.argv):
            if arg not in ['--ai', '--context', input_path] and not arg.endswith('.json'):
                if i > 1:
                    output_path = arg
                    break
        
        try:
            edit_segment(input_path, output_path, use_ai=True, context=context)
        except Exception as e:
            print(f"Error: {str(e)}")
            sys.exit(1)
    else:
        # Placeholder mode
        output_path = sys.argv[2] if len(sys.argv) > 2 else None
        speed_factor = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8
        
        try:
            edit_segment(input_path, output_path, use_ai=False, speed_factor=speed_factor)
        except Exception as e:
            print(f"Error: {str(e)}")
            sys.exit(1)


if __name__ == "__main__":
    main()
