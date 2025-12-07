"""
HLS Converter

Converts MP4 videos to HLS format (segmented for streaming).
Creates .m3u8 playlist and .ts segment files.
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Optional


def convert_to_hls(
    input_path: str,
    output_dir: str,
    segment_duration: int = 10,
    playlist_name: str = "playlist.m3u8"
) -> dict:
    """
    Convert MP4 video to HLS format.
    
    Args:
        input_path: Path to input MP4 video file
        output_dir: Directory to save HLS segments and playlist
        segment_duration: Duration of each segment in seconds (default 10)
        playlist_name: Name of the playlist file (default playlist.m3u8)
    
    Returns:
        Dict with:
        {
            "playlist_path": "...",
            "segments_dir": "...",
            "segment_count": int,
            "total_duration": float
        }
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate segment filename pattern
    segment_filename = os.path.join(output_dir, "segment%03d.ts")
    playlist_path = os.path.join(output_dir, playlist_name)
    
    print(f"Converting {input_path} to HLS format...")
    print(f"Output directory: {output_dir}")
    print(f"Segment duration: {segment_duration}s")
    
    # FFmpeg command to convert to HLS
    # -c copy: Copy codecs (no re-encoding, faster)
    # -f hls: Output format HLS
    # -hls_time: Segment duration
    # -hls_playlist_type vod: Video on demand (not live)
    # -hls_segment_filename: Segment file naming pattern
    ffmpeg_cmd = [
        'ffmpeg',
        '-i', input_path,
        '-c', 'copy',  # Copy codecs (no re-encoding)
        '-f', 'hls',
        '-hls_time', str(segment_duration),
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', segment_filename,
        '-hls_flags', 'independent_segments',
        playlist_path
    ]
    
    try:
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Count segments created
        segments_dir = output_dir
        segment_files = sorted([
            f for f in os.listdir(segments_dir)
            if f.endswith('.ts')
        ])
        segment_count = len(segment_files)
        
        # Get video duration from ffprobe
        duration = get_video_duration(input_path)
        
        print(f"✅ HLS conversion complete!")
        print(f"   Playlist: {playlist_path}")
        print(f"   Segments: {segment_count}")
        print(f"   Duration: {duration:.1f}s")
        
        return {
            "playlist_path": playlist_path,
            "segments_dir": segments_dir,
            "segment_count": segment_count,
            "total_duration": duration,
            "segment_duration": segment_duration
        }
        
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr}")
        raise RuntimeError(f"Failed to convert video to HLS: {e.stderr}")
    except Exception as e:
        raise RuntimeError(f"Error converting to HLS: {str(e)}")


def get_video_duration(video_path: str) -> float:
    """
    Get video duration in seconds using ffprobe.
    
    Args:
        video_path: Path to video file
    
    Returns:
        Duration in seconds
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'json',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        return float(data['format']['duration'])
    except Exception as e:
        print(f"Warning: Could not get video duration: {e}")
        return 0.0


def parse_playlist(playlist_path: str) -> dict:
    """
    Parse HLS playlist file to extract segment information.
    
    Args:
        playlist_path: Path to .m3u8 playlist file
    
    Returns:
        Dict with segment list and metadata
    """
    if not os.path.exists(playlist_path):
        raise FileNotFoundError(f"Playlist not found: {playlist_path}")
    
    segments = []
    target_duration = 10
    
    with open(playlist_path, 'r') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        if line.startswith('#EXT-X-TARGETDURATION:'):
            target_duration = int(line.split(':')[1])
        elif line.startswith('#EXTINF:'):
            # Extract duration
            duration = float(line.split(':')[1].split(',')[0])
        elif line and not line.startswith('#'):
            # This is a segment filename
            segments.append({
                "filename": line,
                "duration": duration if 'duration' in locals() else target_duration
            })
    
    return {
        "segments": segments,
        "target_duration": target_duration,
        "total_segments": len(segments)
    }


def update_playlist_segment(
    playlist_path: str,
    segment_index: int,
    new_segment_filename: str
) -> str:
    """
    Update a specific segment in the playlist with a new segment file.
    
    Args:
        playlist_path: Path to playlist file
        segment_index: Index of segment to replace (0-based)
        new_segment_filename: New segment filename
    
    Returns:
        Updated playlist content as string
    """
    playlist_data = parse_playlist(playlist_path)
    segments = playlist_data["segments"]
    
    if segment_index < 0 or segment_index >= len(segments):
        raise ValueError(f"Segment index {segment_index} out of range")
    
    # Update the segment filename
    segments[segment_index]["filename"] = new_segment_filename
    
    # Rebuild playlist
    playlist_lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        f"#EXT-X-TARGETDURATION:{playlist_data['target_duration']}",
        "#EXT-X-MEDIA-SEQUENCE:0"
    ]
    
    for seg in segments:
        playlist_lines.append(f"#EXTINF:{seg['duration']:.3f},")
        playlist_lines.append(seg["filename"])
    
    playlist_lines.append("#EXT-X-ENDLIST")
    
    return "\n".join(playlist_lines)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python hls_converter.py <input_video> <output_dir> [segment_duration]")
        sys.exit(1)
    
    input_video = sys.argv[1]
    output_dir = sys.argv[2]
    segment_duration = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    
    result = convert_to_hls(input_video, output_dir, segment_duration)
    print(f"\nResult: {json.dumps(result, indent=2)}")

