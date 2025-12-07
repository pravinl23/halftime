"""
Video Segment Inserter

This script inserts an edited segment back into the original video at the specified
start and end times. Handles length changes - if the edited segment is longer or
shorter than the original, the final video adjusts accordingly.

Requirements:
    pip install moviepy

Usage:
    python insert_segment.py <original_video> <edited_segment> <start_time> <end_time> [output_video]
    
    Time formats supported:
    - Seconds: 60.5
    - SRT format: 00:01:00,500
    - HH:MM:SS format: 00:01:00

Example:
    Original: 22 min video
    Extracted segment: 10:12 to 10:28 (16 seconds)
    Edited segment: now 20 seconds (slowed down, effects added, etc.)
    Result: 22 min + 4 seconds video with the edited segment seamlessly inserted
"""

import sys
import os
import subprocess
import tempfile
from moviepy import VideoFileClip


def parse_time(time_str):
    """
    Parse time string into seconds.
    Supports multiple formats:
    - Seconds (float): "60.5"
    - SRT format: "00:01:00,500"
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


def insert_segment(original_path, segment_path, start_time, end_time, output_path=None):
    """
    Insert an edited segment back into the original video.
    
    The edited segment replaces the portion between start_time and end_time.
    If the edited segment is longer/shorter than the original portion,
    the final video duration adjusts accordingly.
    
    Args:
        original_path: Path to original video file
        segment_path: Path to edited segment video file
        start_time: Original start time where segment was extracted (in seconds or parseable format)
        end_time: Original end time where segment was extracted (in seconds or parseable format)
        output_path: Path to output video file (optional)
    
    Returns:
        Path to the output video file
    """
    # Validate input files exist
    if not os.path.exists(original_path):
        raise FileNotFoundError(f"Original video file not found: {original_path}")
    if not os.path.exists(segment_path):
        raise FileNotFoundError(f"Edited segment file not found: {segment_path}")
    
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
        base_name = os.path.splitext(original_path)[0]
        ext = os.path.splitext(original_path)[1]
        output_path = f"{base_name}_edited{ext}"
    
    print(f"Loading original video: {original_path}")
    print(f"Loading edited segment: {segment_path}")
    print(f"Inserting at: {start_seconds:.2f}s to {end_seconds:.2f}s")
    
    original = None
    edited_segment = None
    
    try:
        # Load videos
        original = VideoFileClip(original_path)
        edited_segment = VideoFileClip(segment_path)
        
        # Calculate info
        original_segment_duration = end_seconds - start_seconds
        edited_segment_duration = edited_segment.duration
        duration_diff = edited_segment_duration - original_segment_duration
        
        print(f"\nOriginal video duration: {original.duration:.2f}s")
        print(f"Original segment duration: {original_segment_duration:.2f}s")
        print(f"Edited segment duration: {edited_segment_duration:.2f}s")
        print(f"Duration change: {'+' if duration_diff >= 0 else ''}{duration_diff:.2f}s")
        
        # Validate times are within original video
        if start_seconds > original.duration:
            raise ValueError(f"Start time ({start_seconds}s) exceeds video duration ({original.duration:.2f}s)")
        if end_seconds > original.duration:
            print(f"Warning: End time ({end_seconds}s) exceeds video duration ({original.duration:.2f}s). Using video end.")
            end_seconds = original.duration
        
        # Use ffmpeg directly for fast extraction and concatenation (avoids moviepy processing)
        print(f"\nConcatenating clips via ffmpeg (fast mode)...")
        
        temp_dir = tempfile.mkdtemp(prefix="insert_segment_")
        temp_clips = []
        
        try:
            # Extract before segment with ffmpeg (fast, no re-encoding)
            if start_seconds > 0:
                before_path = os.path.join(temp_dir, "before.mp4")
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-i', original_path,
                    '-t', str(start_seconds),
                    '-c', 'copy',  # Copy without re-encoding
                    before_path
                ]
                subprocess.run(ffmpeg_cmd, capture_output=True, check=True)
                temp_clips.append(before_path)
                print(f"Before segment: 0s to {start_seconds:.2f}s")
            
            # Edited segment (already exists, just copy)
            edited_copy = os.path.join(temp_dir, "edited.mp4")
            import shutil
            shutil.copy2(segment_path, edited_copy)
            temp_clips.append(edited_copy)
            print(f"Edited segment: {edited_segment_duration:.2f}s")
            
            # Extract after segment with ffmpeg (fast, no re-encoding)
            if end_seconds < original.duration:
                after_path = os.path.join(temp_dir, "after.mp4")
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-i', original_path,
                    '-ss', str(end_seconds),
                    '-c', 'copy',  # Copy without re-encoding
                    after_path
                ]
                subprocess.run(ffmpeg_cmd, capture_output=True, check=True)
                temp_clips.append(after_path)
                print(f"After segment: {end_seconds:.2f}s to {original.duration:.2f}s")
            
            # Create concat file
            concat_file = os.path.join(temp_dir, "concat.txt")
            with open(concat_file, 'w') as f:
                for temp_path in temp_clips:
                    f.write(f"file '{temp_path}'\n")
            
            # Concatenate with ffmpeg (very fast, no re-encoding)
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-f', 'concat', '-safe', '0', '-i', concat_file,
                '-c', 'copy',  # Copy streams without re-encoding
                output_path
            ]
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"ffmpeg concat failed: {result.stderr}")
            
            # Get final duration
            final_video = VideoFileClip(output_path)
            final_duration = final_video.duration
            final_video.close()
            
            print(f"Final video duration: {final_duration:.2f}s")
            
        finally:
            # Clean up temp files
            if os.path.exists(temp_dir):
                import shutil
                shutil.rmtree(temp_dir)
        
        print(f"\nSuccessfully created: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise
    finally:
        # Ensure cleanup
        if original:
            original.close()
        if edited_segment:
            edited_segment.close()


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 5:
        print(__doc__)
        print("\nUsage:")
        print("  python insert_segment.py <original_video> <edited_segment> <start_time> <end_time> [output_video]")
        print("\nExample:")
        print("  python insert_segment.py original.mp4 edited_clip.mp4 612 628")
        print("  python insert_segment.py original.mp4 edited_clip.mp4 00:10:12 00:10:28 output.mp4")
        sys.exit(1)
    
    original_path = sys.argv[1]
    segment_path = sys.argv[2]
    start_time = sys.argv[3]
    end_time = sys.argv[4]
    output_path = sys.argv[5] if len(sys.argv) > 5 else None
    
    try:
        insert_segment(original_path, segment_path, start_time, end_time, output_path)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

