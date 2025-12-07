"""
Dynamic HLS Playlist Endpoint

Serves and updates HLS playlists dynamically.
When edited segments are ready, playlist updates to include them.
"""

import os
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import FileResponse
from app.core.security import get_current_user
from app.api.v1.videos.process import processing_jobs

router = APIRouter()


@router.get("/playlist/{job_id}.m3u8")
async def get_playlist(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get HLS playlist for a video.
    
    Returns dynamic playlist that updates when edited segments are ready.
    If processing is complete, includes edited segments.
    Otherwise, returns original playlist.
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = processing_jobs[job_id]
    
    # Verify user owns this job
    if job.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    output_dir = job["output_dir"]
    
    # Check if we have edited segments ready
    if job["status"] == "completed" and job.get("edited_segments"):
        # Serve updated playlist with edited segments
        playlist_path = os.path.join(output_dir, "segments", "playlist.m3u8")
        
        # If playlist doesn't exist, generate it
        if not os.path.exists(playlist_path):
            playlist_path = generate_updated_playlist(job, output_dir, job_id)
    else:
        # Serve original playlist, but update segment URLs to use API endpoint
        original_dir = os.path.join(output_dir, "original")
        original_playlist = os.path.join(original_dir, "playlist.m3u8")
        
        if not os.path.exists(original_playlist):
            raise HTTPException(
                status_code=404,
                detail="Playlist not found. Video may still be processing."
            )
        
        # Read original playlist and update segment URLs
        playlist_path = os.path.join(output_dir, "playlist_temp.m3u8")
        with open(original_playlist, 'r') as f:
            lines = f.readlines()
        
        updated_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and line.endswith('.ts'):
                # Update segment URL to use API endpoint
                segment_file = os.path.basename(line)
                updated_lines.append(f"/api/v1/videos/segments/{job_id}/{segment_file}")
            else:
                updated_lines.append(line)
        
        with open(playlist_path, 'w') as f:
            f.write("\n".join(updated_lines))
    
    # Return playlist file with correct MIME type
    return FileResponse(
        playlist_path,
        media_type="application/vnd.apple.mpegurl",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


def generate_updated_playlist(job: dict, output_dir: str, job_id: str) -> str:
    """
    Generate updated playlist with edited segments.
    
    Args:
        job: Job dictionary with processing info
        output_dir: Output directory for segments
        job_id: Job ID for segment URLs
    
    Returns:
        Path to generated playlist file
    """
    segments_dir = os.path.join(output_dir, "segments")
    playlist_path = os.path.join(segments_dir, "playlist.m3u8")
    
    # Get segment info
    hls_info = job.get("hls_info", {})
    segment_count = hls_info.get("segment_count", 0)
    target_duration = hls_info.get("segment_duration", 10)
    
    edited_segments = job.get("edited_segments", {})
    start_segment = edited_segments.get("start", 0)
    end_segment = edited_segments.get("end", segment_count)
    
    # Build playlist
    playlist_lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        f"#EXT-X-TARGETDURATION:{target_duration}",
        "#EXT-X-MEDIA-SEQUENCE:0"
    ]
    
    # Add all segments with correct URLs
    for i in range(segment_count):
        segment_file = f"segment{i:03d}.ts"
        segment_path = os.path.join(segments_dir, segment_file)
        
        if os.path.exists(segment_path):
            # Use API endpoint for segment URL
            segment_url = f"/api/v1/videos/segments/{job_id}/{segment_file}"
            playlist_lines.append(f"#EXTINF:{target_duration:.3f},")
            playlist_lines.append(segment_url)
    
    playlist_lines.append("#EXT-X-ENDLIST")
    
    # Write playlist
    os.makedirs(segments_dir, exist_ok=True)
    with open(playlist_path, 'w') as f:
        f.write("\n".join(playlist_lines))
    
    return playlist_path

