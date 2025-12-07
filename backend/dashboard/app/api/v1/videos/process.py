"""
Video Processing API

Starts async video processing for ad insertion.
Returns job_id and playlist URL for HLS streaming.
"""

import sys
import os
import uuid
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

# Add videos directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'videos'))

from main import process_ad_placement
from hls_converter import convert_to_hls
from app.core.security import get_current_user


router = APIRouter()

# In-memory job storage (replace with database in production)
processing_jobs = {}


class VideoProcessRequest(BaseModel):
    """Request to process a video with ad insertion."""
    video_path: str
    subtitle_path: str
    product: dict  # Product info for ad
    user_data: Optional[dict] = None
    buffer_seconds: int = 10
    use_ai: bool = False


class VideoProcessResponse(BaseModel):
    """Response with job info and playlist URL."""
    job_id: str
    status: str
    playlist_url: str
    estimated_completion: Optional[str] = None


async def process_video_background(
    job_id: str,
    video_path: str,
    subtitle_path: str,
    product: dict,
    user_data: dict,
    buffer_seconds: int,
    use_ai: bool,
    output_dir: str
):
    """
    Background task to process video with ad insertion.
    
    Args:
        job_id: Unique job identifier
        video_path: Path to original video
        subtitle_path: Path to subtitle file
        product: Product info for ad
        user_data: User data for personalization
        buffer_seconds: Buffer around insertion point
        use_ai: Whether to use AI video generation
        output_dir: Directory for HLS output
    """
    try:
        # Update job status
        processing_jobs[job_id]["status"] = "processing"
        processing_jobs[job_id]["progress"] = 10
        
        # First, convert original video to HLS if not already done
        hls_output_dir = os.path.join(output_dir, "original")
        if not os.path.exists(os.path.join(hls_output_dir, "playlist.m3u8")):
            processing_jobs[job_id]["progress"] = 20
            hls_result = convert_to_hls(
                video_path,
                hls_output_dir,
                segment_duration=10
            )
            processing_jobs[job_id]["hls_info"] = hls_result
        
        processing_jobs[job_id]["progress"] = 30
        
        # Prepare input data for ad placement
        input_data = {
            "subtitle_path": subtitle_path,
            "video_path": video_path,
            "product": product,
            "user_data": user_data or {},
            "buffer_seconds": buffer_seconds
        }
        
        # Find ad placement
        processing_jobs[job_id]["progress"] = 40
        placement_result = process_ad_placement(
            input_data,
            buffer_seconds=buffer_seconds,
            use_ai=use_ai
        )
        
        processing_jobs[job_id]["progress"] = 60
        processing_jobs[job_id]["placement"] = placement_result
        
        # Get insertion point and calculate which segments need editing
        insertion_point = placement_result["placement"]["insertion_point"]
        buffer_start = placement_result["placement"]["buffer_start"]
        buffer_end = placement_result["placement"]["buffer_end"]
        
        # Calculate segment indices (assuming 10s segments)
        # This is simplified - in production, parse actual segment timestamps
        from transcript_parser import timestamp_to_seconds
        start_seconds = timestamp_to_seconds(buffer_start)
        end_seconds = timestamp_to_seconds(buffer_end)
        segment_duration = 10
        
        start_segment = int(start_seconds / segment_duration)
        end_segment = int(end_seconds / segment_duration) + 1
        
        processing_jobs[job_id]["progress"] = 70
        processing_jobs[job_id]["edited_segments"] = {
            "start": start_segment,
            "end": end_segment,
            "edited_video_path": placement_result.get("output_video")
        }
        
        # Extract and convert only the edited segment range to HLS
        if placement_result.get("output_video"):
            # Extract only the buffer range from the edited video
            from extract_segment import extract_segment
            edited_segment_path = os.path.join(output_dir, "edited_segment.mp4")
            extract_segment(
                placement_result["output_video"],
                buffer_start,
                buffer_end,
                edited_segment_path
            )
            
            # Convert the edited segment to HLS
            edited_hls_dir = os.path.join(output_dir, "edited_hls")
            edited_hls_result = convert_to_hls(
                edited_segment_path,
                edited_hls_dir,
                segment_duration=10
            )
            
            # Now merge: original segments + edited segments + remaining original segments
            main_segments_dir = os.path.join(output_dir, "segments")
            os.makedirs(main_segments_dir, exist_ok=True)
            
            original_segments_dir = os.path.join(hls_output_dir)
            edited_segments_dir = edited_hls_dir
            import shutil
            
            total_segments = processing_jobs[job_id]["hls_info"]["segment_count"]
            edited_segment_count = edited_hls_result["segment_count"]
            
            # Copy original segments before edited range
            for i in range(start_segment):
                seg_file = f"segment{i:03d}.ts"
                src = os.path.join(original_segments_dir, seg_file)
                dst = os.path.join(main_segments_dir, seg_file)
                if os.path.exists(src):
                    shutil.copy2(src, dst)
            
            # Copy edited segments (they start from segment000.ts in edited_hls_dir)
            for i in range(edited_segment_count):
                src_seg_file = f"segment{i:03d}.ts"
                dst_seg_file = f"segment{start_segment + i:03d}.ts"
                src = os.path.join(edited_segments_dir, src_seg_file)
                dst = os.path.join(main_segments_dir, dst_seg_file)
                if os.path.exists(src):
                    shutil.copy2(src, dst)
            
            # Calculate new end segment (may be different due to ad length)
            new_end_segment = start_segment + edited_segment_count
            
            # Copy remaining original segments (adjusting for potential length difference)
            # Start from the segment that would come after the edited range
            remaining_start = end_segment
            for i in range(remaining_start, total_segments):
                src_seg_file = f"segment{i:03d}.ts"
                dst_seg_file = f"segment{new_end_segment + (i - remaining_start):03d}.ts"
                src = os.path.join(original_segments_dir, src_seg_file)
                dst = os.path.join(main_segments_dir, dst_seg_file)
                if os.path.exists(src):
                    shutil.copy2(src, dst)
            
            # Update segment count in job info
            processing_jobs[job_id]["hls_info"]["segment_count"] = (
                start_segment + edited_segment_count + (total_segments - remaining_start)
            )
        
        processing_jobs[job_id]["progress"] = 90
        
        # Mark as completed
        processing_jobs[job_id]["status"] = "completed"
        processing_jobs[job_id]["progress"] = 100
        processing_jobs[job_id]["completed_at"] = datetime.now().isoformat()
        
    except Exception as e:
        processing_jobs[job_id]["status"] = "failed"
        processing_jobs[job_id]["error"] = str(e)
        print(f"Video processing error for job {job_id}: {e}")


@router.post("/process", response_model=VideoProcessResponse)
async def start_video_processing(
    request: VideoProcessRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Start async video processing for ad insertion.
    
    Returns job_id and playlist URL. Processing happens in background.
    """
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Create output directory for this job
    output_base = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', 'video_outputs')
    os.makedirs(output_base, exist_ok=True)
    output_dir = os.path.join(output_base, job_id)
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize job status
    processing_jobs[job_id] = {
        "status": "queued",
        "progress": 0,
        "video_path": request.video_path,
        "output_dir": output_dir,
        "created_at": datetime.now().isoformat(),
        "user_id": current_user["id"]
    }
    
    # Start background processing
    background_tasks.add_task(
        process_video_background,
        job_id=job_id,
        video_path=request.video_path,
        subtitle_path=request.subtitle_path,
        product=request.product,
        user_data=request.user_data,
        buffer_seconds=request.buffer_seconds,
        use_ai=request.use_ai,
        output_dir=output_dir
    )
    
    # Generate playlist URL
    playlist_url = f"/api/v1/videos/playlist/{job_id}.m3u8"
    
    return VideoProcessResponse(
        job_id=job_id,
        status="queued",
        playlist_url=playlist_url,
        estimated_completion=None  # Could calculate based on video length
    )


@router.get("/status/{job_id}")
async def get_processing_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get the status of a video processing job.
    
    Returns:
        {
            "status": "queued|processing|completed|failed",
            "progress": 0-100,
            "playlist_url": "...",
            "error": "..." (if failed)
        }
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = processing_jobs[job_id]
    
    # Verify user owns this job
    if job.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    playlist_url = f"/api/v1/videos/playlist/{job_id}.m3u8"
    
    response = {
        "status": job["status"],
        "progress": job.get("progress", 0),
        "playlist_url": playlist_url
    }
    
    if job["status"] == "failed":
        response["error"] = job.get("error", "Unknown error")
    
    if job["status"] == "completed":
        response["completed_at"] = job.get("completed_at")
    
    return response

