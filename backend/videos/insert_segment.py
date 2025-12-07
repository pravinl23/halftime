#!/usr/bin/env python3
"""
Video segment replacement using hardware acceleration.
"""

import subprocess
import sys
import os


def insert_segment(original_path: str, ai_clip_path: str, cut_start: float, cut_end: float, output_path: str):
    """
    Replace segment [cut_start, cut_end] in original video with ai_clip.
    Uses VideoToolbox hardware acceleration for speed.
    """
    
    if not os.path.exists(original_path):
        raise FileNotFoundError(f"Original video not found: {original_path}")
    if not os.path.exists(ai_clip_path):
        raise FileNotFoundError(f"AI clip not found: {ai_clip_path}")
    
    print(f"Original: {original_path}")
    print(f"AI clip: {ai_clip_path}")
    print(f"Replacing: {cut_start}s to {cut_end}s")
    print(f"Output: {output_path}")
    
    # Single command with filter_complex
    # Hardware accelerated encoding with VideoToolbox
    filter_complex = (
        f"[0:v]trim=0:{cut_start},setpts=PTS-STARTPTS,setsar=1[v0];"
        f"[0:a]atrim=0:{cut_start},asetpts=PTS-STARTPTS[a0];"
        f"[1:v]scale=1920:1080,setsar=1,fps=24000/1001,setpts=PTS-STARTPTS[v1];"
        f"[1:a]aresample=48000,pan=5.1|FL=FL|FR=FR|FC=FC|LFE=LFE|BL=FL|BR=FR,asetpts=PTS-STARTPTS[a1];"
        f"[0:v]trim=start={cut_end},setpts=PTS-STARTPTS,setsar=1[v2];"
        f"[0:a]atrim=start={cut_end},asetpts=PTS-STARTPTS[a2];"
        f"[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[outv][outa]"
    )
    
    cmd = [
        'ffmpeg', '-y',
        '-i', original_path,
        '-i', ai_clip_path,
        '-filter_complex', filter_complex,
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'h264_videotoolbox',  # Hardware accelerated H264
        '-b:v', '8M',  # Good quality bitrate
        '-c:a', 'aac', '-b:a', '256k',
        '-movflags', '+faststart',
        output_path
    ]
    
    print("\nRunning ffmpeg with hardware acceleration...")
    print("This should take ~3-5 minutes for a 43 min video\n")
    
    # Run with live output
    process = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True)
    
    for line in process.stderr:
        if 'frame=' in line or 'speed=' in line:
            print(f"\r{line.strip()}", end='', flush=True)
    
    process.wait()
    
    if process.returncode != 0:
        raise RuntimeError("FFmpeg failed")
    
    print(f"\n\nDone! Output: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: python insert_segment.py <original.mp4> <ai_clip.mp4> <cut_start> <cut_end> <output.mp4>")
        sys.exit(1)
    
    insert_segment(
        sys.argv[1],
        sys.argv[2],
        float(sys.argv[3]),
        float(sys.argv[4]),
        sys.argv[5]
    )
