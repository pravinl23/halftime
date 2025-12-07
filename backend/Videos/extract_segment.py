"""
Video Segment Extractor

This script extracts a segment from an MP4 video file based on start and end times.
Uses moviepy library for video processing.

Requirements:
    pip install moviepy

Usage:
    python extract_segment.py <input_video> <start_time> <end_time> [output_video]
    
    Time formats supported:
    - Seconds: 60.5
    - SRT format: 00:01:00,500
    - HH:MM:SS format: 00:01:00
"""

import sys
import os
from moviepy import VideoFileClip


def parse_time(time_str):
    """
    Parse time string into seconds.
    Supports multiple formats:
    - Seconds (float): "60.5"
    - SRT format: "00:01:00,500" or "00:01:00,500"
    - HH:MM:SS format: "00:01:00"
    """
    # Try parsing as float (seconds)
    try:
        return float(time_str)
    except ValueError:
        pass
    
    # Try parsing SRT format (HH:MM:SS,mmm)
    if ',' in time_str:
        time_part, ms_part = time_str.split(',')
        parts = time_part.split(':')
        if len(parts) == 3:
            hours, minutes, seconds = map(int, parts)
            milliseconds = int(ms_part)
            return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0
    
    # Try parsing HH:MM:SS format
    if ':' in time_str:
        parts = time_str.split(':')
        if len(parts) == 3:
            hours, minutes, seconds = map(int, parts)
            return hours * 3600 + minutes * 60 + seconds
        elif len(parts) == 2:
            minutes, seconds = map(int, parts)
            return minutes * 60 + seconds
    
    raise ValueError(f"Unable to parse time format: {time_str}")


def extract_segment(input_path, start_time, end_time, output_path=None):
    """
    Extract a segment from a video file.
    
    Args:
        input_path: Path to input video file
        start_time: Start time (in seconds or parseable format)
        end_time: End time (in seconds or parseable format)
        output_path: Path to output video file (optional)
    
    Returns:
        Path to the output video file
    """
    # Validate input file exists
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video file not found: {input_path}")
    
    # Parse times
    start_seconds = parse_time(start_time) if isinstance(start_time, str) else start_time
    end_seconds = parse_time(end_time) if isinstance(end_time, str) else end_time
    
    # Validate times
    if start_seconds < 0:
        raise ValueError("Start time cannot be negative")
    if end_seconds <= start_seconds:
        raise ValueError("End time must be greater than start time")
    
    # Generate output path if not provided
    if output_path is None:
        base_name = os.path.splitext(input_path)[0]
        ext = os.path.splitext(input_path)[1]
        output_path = f"{base_name}_segment_{start_seconds:.2f}_{end_seconds:.2f}{ext}"
    
    print(f"Loading video: {input_path}")
    print(f"Extracting segment: {start_seconds:.2f}s to {end_seconds:.2f}s")
    
    # Load video and extract segment
    try:
        video = VideoFileClip(input_path)
        
        # Check if times are within video duration
        if start_seconds > video.duration:
            raise ValueError(f"Start time ({start_seconds}s) exceeds video duration ({video.duration:.2f}s)")
        
        if end_seconds > video.duration:
            print(f"Warning: End time ({end_seconds}s) exceeds video duration ({video.duration:.2f}s). Using video end.")
            end_seconds = video.duration
        
        # Extract segment (moviepy 2.x API - use subclipped method)
        segment = video.subclipped(start_seconds, end_seconds)
        
        print(f"Writing output to: {output_path}")
        # Use faster preset for intermediate extraction
        segment.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            preset='ultrafast',  # Faster encoding for intermediate files
            threads=4,  # Use multiple threads
            logger=None  # Suppress verbose output
        )
        
        # Clean up
        segment.close()
        video.close()
        
        print(f"Successfully extracted segment to: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 4:
        print(__doc__)
        print("\nExample:")
        print("  python extract_segment.py video.mp4 60 120")
        print("  python extract_segment.py video.mp4 00:01:00 00:02:00 output.mp4")
        print("  python extract_segment.py video.mp4 00:01:00,500 00:02:00,750")
        sys.exit(1)
    
    input_path = sys.argv[1]
    start_time = sys.argv[2]
    end_time = sys.argv[3]
    output_path = sys.argv[4] if len(sys.argv) > 4 else None
    
    try:
        extract_segment(input_path, start_time, end_time, output_path)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

