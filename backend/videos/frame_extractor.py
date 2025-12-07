"""
Frame Extractor

Extracts frames from video at specific timestamps for visual analysis.
"""

import os
import base64
from moviepy import VideoFileClip
from transcript_parser import timestamp_to_seconds


def extract_frame(video_path: str, timestamp: str, output_path: str = None) -> str:
    """
    Extract a single frame from video at the given timestamp.
    
    Args:
        video_path: Path to video file
        timestamp: Timestamp in HH:MM:SS,mmm format or seconds
        output_path: Optional output path for the frame image
        
    Returns:
        Path to the extracted frame image
    """
    # Convert timestamp to seconds
    if isinstance(timestamp, str):
        seconds = timestamp_to_seconds(timestamp)
    else:
        seconds = float(timestamp)
    
    # Generate output path if not provided
    if output_path is None:
        base_name = os.path.splitext(video_path)[0]
        output_path = f"{base_name}_frame_{seconds:.2f}.jpg"
    
    # Extract frame
    clip = VideoFileClip(video_path)
    
    # Make sure we don't exceed video duration
    if seconds > clip.duration:
        seconds = clip.duration - 0.1
    
    # Save frame
    clip.save_frame(output_path, t=seconds)
    clip.close()
    
    return output_path


def extract_frames_at_timestamps(video_path: str, timestamps: list[str], output_dir: str = None) -> list[dict]:
    """
    Extract frames at multiple timestamps.
    
    Args:
        video_path: Path to video file
        timestamps: List of timestamps
        output_dir: Directory to save frames (uses temp if not provided)
        
    Returns:
        List of dicts with timestamp and frame_path
    """
    import tempfile
    
    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="frames_")
    
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    clip = VideoFileClip(video_path)
    
    for i, timestamp in enumerate(timestamps):
        # Convert timestamp to seconds
        if isinstance(timestamp, str):
            seconds = timestamp_to_seconds(timestamp)
        else:
            seconds = float(timestamp)
        
        # Make sure we don't exceed video duration
        if seconds > clip.duration:
            seconds = clip.duration - 0.1
        
        # Save frame
        frame_path = os.path.join(output_dir, f"frame_{i}_{seconds:.2f}.jpg")
        clip.save_frame(frame_path, t=seconds)
        
        results.append({
            "index": i,
            "timestamp": timestamp,
            "seconds": seconds,
            "frame_path": frame_path
        })
    
    clip.close()
    return results


def frame_to_base64(frame_path: str) -> str:
    """
    Convert a frame image to base64 for API transmission.
    
    Args:
        frame_path: Path to the image file
        
    Returns:
        Base64 encoded string
    """
    with open(frame_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python frame_extractor.py <video_path> <timestamp>")
        print("Example: python frame_extractor.py video.mp4 00:12:56")
        sys.exit(1)
    
    video_path = sys.argv[1]
    timestamp = sys.argv[2]
    
    frame_path = extract_frame(video_path, timestamp)
    print(f"Extracted frame to: {frame_path}")



