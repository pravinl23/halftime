"""
Video Processing Pipeline

Complete pipeline that:
1. Extracts a segment from a video at specified timestamps
2. Edits the segment (currently: black & white + slow down)
3. Inserts the edited segment back into the original video

Output: {original_filename}_output.mp4

Requirements:
    pip install moviepy numpy

Usage:
    python process_video.py <input_video> <start_time> <end_time> [speed_factor]
    
    Time formats supported:
    - Seconds: 60.5
    - SRT format: 00:01:00,500
    - HH:MM:SS format: 00:01:00

Example:
    python process_video.py video.mp4 00:10:12 00:10:28
    python process_video.py video.mp4 612 628 0.75
"""

import sys
import os
import tempfile
import shutil

from extract_segment import extract_segment
from edit_segment import edit_segment
from insert_segment import insert_segment


def process_video(input_path, start_time, end_time, speed_factor=0.8, output_path=None):
    """
    Complete video processing pipeline.
    
    1. Extract segment at timestamps
    2. Edit segment (black & white + speed adjustment)
    3. Insert edited segment back into original
    
    Args:
        input_path: Path to input video file
        start_time: Start time (in seconds or parseable format)
        end_time: End time (in seconds or parseable format)
        speed_factor: Speed multiplier for edit (0.8 = slower/longer)
        output_path: Path to output video file (optional)
    
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
        print(f"Speed factor: {speed_factor}")
        print(f"Output: {output_path}")
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
        edit_segment(extracted_path, edited_path, speed_factor)
        
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
        print("\nExamples:")
        print("  python process_video.py video.mp4 00:10:12 00:10:28")
        print("  python process_video.py video.mp4 612 628")
        print("  python process_video.py video.mp4 00:10:12 00:10:28 0.75")
        sys.exit(1)
    
    input_path = sys.argv[1]
    start_time = sys.argv[2]
    end_time = sys.argv[3]
    speed_factor = float(sys.argv[4]) if len(sys.argv) > 4 else 0.8
    
    try:
        process_video(input_path, start_time, end_time, speed_factor)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

