"""
Video Processing Pipeline

Complete pipeline that:
1. Extracts a segment from a video at specified timestamps
2. Edits the segment (AI generation or placeholder effects)
3. Inserts the edited segment back into the original video

Output: {original_filename}_output.mp4

Requirements:
    pip install moviepy numpy requests python-dotenv

Usage:
    python process_video.py <input_video> <start_time> <end_time> [--ai] [--context context.json]
    
    Time formats supported:
    - Seconds: 60.5
    - SRT format: 00:01:00,500
    - HH:MM:SS format: 00:01:00

Example:
    python process_video.py video.mp4 00:10:12 00:10:28
    python process_video.py video.mp4 612 628 --ai --context ad_context.json
"""

import sys
import os
import json
import tempfile
import shutil
from typing import Optional

from extract_segment import extract_segment
from edit_segment import edit_segment
from insert_segment import insert_segment


def process_video(
    input_path: str,
    start_time: str,
    end_time: str,
    speed_factor: float = 0.8,
    output_path: str = None,
    use_ai: bool = False,
    context: dict = None
) -> str:
    """
    Complete video processing pipeline.
    
    1. Extract segment at timestamps
    2. Edit segment (AI or placeholder)
    3. Insert edited segment back into original
    
    Args:
        input_path: Path to input video file
        start_time: Start time (in seconds or parseable format)
        end_time: End time (in seconds or parseable format)
        speed_factor: Speed multiplier for placeholder edit (0.8 = slower/longer)
        output_path: Path to output video file (optional)
        use_ai: Whether to use AI video generation
        context: Context dict for AI mode (product_info, summaries, user_data, etc.)
    
    Returns:
        Path to the output video file
    """
    # Validate input file exists
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video file not found: {input_path}")
    
    # Generate output path if not provided
    if output_path is None:
        base_name = os.path.splitext(input_path)[0]
        ext = os.path.splitext(input_path)[1]
        output_path = f"{base_name}_output{ext}"
    
    # Create temp directory for intermediate files
    temp_dir = tempfile.mkdtemp(prefix="video_pipeline_")
    
    try:
        print("=" * 60)
        print("VIDEO PROCESSING PIPELINE")
        print("=" * 60)
        print(f"Input: {input_path}")
        print(f"Segment: {start_time} to {end_time}")
        print(f"Mode: {'AI Generation' if use_ai else f'Placeholder (speed={speed_factor})'}")
        print(f"Output: {output_path}")
        if use_ai and context:
            print(f"Product: {context.get('product_info', {}).get('product', 'N/A')}")
        print("=" * 60)
        
        # Step 1: Extract segment
        print("\n[STEP 1/3] Extracting segment...")
        print("-" * 40)
        extracted_path = os.path.join(temp_dir, "extracted.mp4")
        extract_segment(input_path, start_time, end_time, extracted_path)
        
        # Step 2: Edit segment
        print("\n[STEP 2/3] Editing segment...")
        print("-" * 40)
        edited_path = os.path.join(temp_dir, "edited.mp4")
        
        edit_segment(
            input_path=extracted_path,
            output_path=edited_path,
            use_ai=use_ai,
            speed_factor=speed_factor,
            context=context
        )
        
        # Step 3: Insert back into original
        print("\n[STEP 3/3] Inserting edited segment...")
        print("-" * 40)
        insert_segment(input_path, edited_path, start_time, end_time, output_path)
        
        print("\n" + "=" * 60)
        print("PIPELINE COMPLETE")
        print("=" * 60)
        print(f"Output saved to: {output_path}")
        print("=" * 60)
        
        return output_path
        
    except Exception as e:
        print(f"\nPipeline error: {str(e)}")
        raise
    finally:
        # Clean up temp files
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            print(f"\nCleaned up temporary files.")


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 4:
        print(__doc__)
        print("\nUsage:")
        print("  python process_video.py <input_video> <start_time> <end_time> [speed_factor]")
        print("  python process_video.py <input_video> <start_time> <end_time> --ai --context context.json")
        print("\nExamples:")
        print("  python process_video.py video.mp4 00:10:12 00:10:28")
        print("  python process_video.py video.mp4 612 628")
        print("  python process_video.py video.mp4 00:10:12 00:10:28 --ai --context ad_context.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    start_time = sys.argv[2]
    end_time = sys.argv[3]
    
    use_ai = '--ai' in sys.argv
    context = None
    speed_factor = 0.8
    
    if '--context' in sys.argv:
        idx = sys.argv.index('--context')
        if idx + 1 < len(sys.argv):
            with open(sys.argv[idx + 1], 'r') as f:
                context = json.load(f)
    
    # Check for speed factor (only if not using AI and it's a number)
    for arg in sys.argv[4:]:
        if arg not in ['--ai', '--context'] and not arg.endswith('.json'):
            try:
                speed_factor = float(arg)
            except ValueError:
                pass
    
    try:
        process_video(
            input_path=input_path,
            start_time=start_time,
            end_time=end_time,
            speed_factor=speed_factor,
            use_ai=use_ai,
            context=context
        )
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
