"""
Video Segment Editor

Placeholder editor that applies simple effects to a video segment.
Currently: converts to black & white and extends duration by slowing down.

This will be replaced with AI video generation in the future.

Requirements:
    pip install moviepy numpy

Usage:
    python edit_segment.py <input_video> [output_video] [speed_factor]
    
    speed_factor: 0.8 = 20% slower (extends duration), 1.0 = no change, 1.2 = 20% faster
"""

import sys
import os
import numpy as np
from moviepy import VideoFileClip


def make_grayscale(frame):
    """Convert a single frame to grayscale (black & white)."""
    gray = np.dot(frame[..., :3], [0.299, 0.587, 0.114])
    return gray[:, :, np.newaxis].repeat(3, axis=2).astype(np.uint8)


def edit_segment(input_path, output_path=None, speed_factor=0.8):
    """
    Apply simple edits to a video segment.
    
    Current effects:
    - Convert to black & white
    - Slow down/speed up (adjusts duration)
    
    Args:
        input_path: Path to input video file
        output_path: Path to output video file (optional)
        speed_factor: Speed multiplier (0.8 = slower/longer, 1.2 = faster/shorter)
    
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
        output_path = f"{base_name}_edited{ext}"
    
    print(f"Loading video: {input_path}")
    
    clip = None
    
    try:
        clip = VideoFileClip(input_path)
        original_duration = clip.duration
        
        print(f"Original duration: {original_duration:.2f}s")
        print(f"Applying speed factor: {speed_factor}")
        
        # Apply speed change (affects duration)
        if speed_factor != 1.0:
            processed = clip.with_speed_scaled(speed_factor)
            new_duration = processed.duration
            print(f"New duration: {new_duration:.2f}s ({'+' if new_duration > original_duration else ''}{new_duration - original_duration:.2f}s)")
        else:
            processed = clip
        
        # Apply black & white effect
        print("Applying black & white filter...")
        final = processed.with_updated_frame_function(
            lambda t: make_grayscale(processed.get_frame(t))
        )
        
        print(f"Writing output to: {output_path}")
        final.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            preset='medium',
            logger=None  # Suppress verbose output
        )
        
        # Clean up
        final.close()
        if processed != clip:
            processed.close()
        
        print(f"\nSuccessfully edited: {output_path}")
        print(f"Duration change: {original_duration:.2f}s -> {new_duration:.2f}s")
        return output_path
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise
    finally:
        if clip:
            clip.close()


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nUsage:")
        print("  python edit_segment.py <input_video> [output_video] [speed_factor]")
        print("\nExamples:")
        print("  python edit_segment.py clip.mp4")
        print("  python edit_segment.py clip.mp4 clip_edited.mp4")
        print("  python edit_segment.py clip.mp4 clip_edited.mp4 0.8  # 20% slower")
        print("  python edit_segment.py clip.mp4 clip_edited.mp4 0.75 # 25% slower")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    speed_factor = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8
    
    try:
        edit_segment(input_path, output_path, speed_factor)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

