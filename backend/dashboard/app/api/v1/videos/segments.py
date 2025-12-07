"""
HLS Segment Serving

Serves .ts segment files for HLS streaming.
"""

import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from app.core.security import get_current_user
from app.api.v1.videos.process import processing_jobs

router = APIRouter()


@router.get("/segments/{job_id}/{segment_file}")
async def get_segment(
    job_id: str,
    segment_file: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Serve HLS segment file (.ts).
    
    Args:
        job_id: Job identifier
        segment_file: Segment filename (e.g., segment000.ts)
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = processing_jobs[job_id]
    
    # Verify user owns this job
    if job.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    output_dir = job["output_dir"]
    
    # Determine which segments directory to use
    if job["status"] == "completed" and job.get("edited_segments"):
        # Use merged segments directory
        segments_dir = os.path.join(output_dir, "segments")
    else:
        # Use original segments
        segments_dir = os.path.join(output_dir, "original")
    
    segment_path = os.path.join(segments_dir, segment_file)
    
    if not os.path.exists(segment_path):
        raise HTTPException(status_code=404, detail="Segment not found")
    
    # Return segment file with correct MIME type
    return FileResponse(
        segment_path,
        media_type="video/mp2t",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
        }
    )

