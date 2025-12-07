"""
Ad Placement Analyzer

Core logic for finding optimal ad placement timestamps in video content
using transcript analysis and Grok AI.

Supports multi-pass analysis:
1. Pass 1: Find candidates from transcript
2. Pass 2: Extract frames, use Grok Vision to select best
"""

from dataclasses import dataclass, asdict
from typing import Optional, TYPE_CHECKING
import json
import os
import tempfile
import shutil

from transcript_parser import TranscriptParser, seconds_to_timestamp, timestamp_to_seconds

if TYPE_CHECKING:
    from grok_client import GrokClient


@dataclass
class AdPlacement:
    """Represents the optimal ad placement with buffer and context."""
    insertion_point: str      # The exact timestamp to insert the ad
    buffer_start: str         # Start of the clip to edit (insertion_point - 10s)
    buffer_end: str           # End of the clip to edit (insertion_point + 10s)
    confidence: float         # 0.0 to 1.0
    reason: str               # Why this placement was chosen
    context_relevance: str    # How it relates to product/user
    summary_before: str       # What happens in the ~10s before
    summary_after: str        # What happens in the ~10s after


@dataclass
class PlacementResult:
    """Result of ad placement analysis."""
    placement: AdPlacement
    overall_analysis: str
    video_duration: Optional[float] = None
    total_gaps_found: int = 0


class AdPlacementAnalyzer:
    """Analyzes video content to find optimal ad placement timestamps."""
    
    def __init__(
        self, 
        min_gap_duration: float = 1.5,
        grok_client: Optional["GrokClient"] = None
    ):
        """
        Initialize the analyzer.
        
        Args:
            min_gap_duration: Minimum gap duration (seconds) to consider for ads.
            grok_client: Optional GrokClient instance. Creates one if not provided.
        """
        self.min_gap_duration = min_gap_duration
        self.parser = TranscriptParser(min_gap_duration=min_gap_duration)
        self._grok_client = grok_client
    
    @property
    def grok_client(self) -> "GrokClient":
        """Lazy-load GrokClient only when needed."""
        if self._grok_client is None:
            from grok_client import GrokClient
            self._grok_client = GrokClient()
        return self._grok_client
    
    def analyze(
        self,
        subtitle_path: str,
        user_data: dict,
        product_info: dict,
        buffer_before: int = 10,
        buffer_after: int = 3,
        video_duration: Optional[float] = None
    ) -> PlacementResult:
        """
        Analyze video content and find the optimal ad placement.
        
        Args:
            subtitle_path: Path to SRT/VTT subtitle file.
            user_data: User preferences/interests dict.
            product_info: Product/company information dict.
            buffer_before: Seconds BEFORE insertion point (default 10s).
            buffer_after: Seconds AFTER insertion point (default 3s).
            video_duration: Optional video duration in seconds.
            
        Returns:
            PlacementResult with the optimal ad placement and context.
        """
        # Parse transcript
        entries = self.parser.parse_file(subtitle_path)
        if not entries:
            raise ValueError(f"No subtitle entries found in {subtitle_path}")
        
        # Detect gaps
        gaps = self.parser.find_gaps()
        
        # Get transcript summary for context
        transcript_summary = self.parser.get_transcript_summary(max_entries=100)
        
        # Format gaps for API
        gaps_data = [
            {
                "start_time": seconds_to_timestamp(g.start_time),
                "end_time": seconds_to_timestamp(g.end_time),
                "duration": g.duration,
                "context_before": g.context_before,
                "context_after": g.context_after
            }
            for g in gaps
        ]
        
        # Call Grok for analysis
        result = self.grok_client.analyze_ad_placement(
            transcript_summary=transcript_summary,
            gaps=gaps_data,
            user_data=user_data,
            product_info=product_info,
            buffer_before=buffer_before,
            buffer_after=buffer_after
        )
        
        # Parse response into structured result
        p = result.get("placement", {})
        
        # Calculate buffer timestamps if not provided by API
        insertion_point = p.get("insertion_point", "00:00:00,000")
        try:
            insertion_seconds = timestamp_to_seconds(insertion_point)
            buffer_start = p.get("buffer_start") or seconds_to_timestamp(max(0, insertion_seconds - buffer_before))
            buffer_end = p.get("buffer_end") or seconds_to_timestamp(insertion_seconds + buffer_after)
        except ValueError:
            buffer_start = p.get("buffer_start", "00:00:00,000")
            buffer_end = p.get("buffer_end", "00:00:13,000")
        
        placement = AdPlacement(
            insertion_point=insertion_point,
            buffer_start=buffer_start,
            buffer_end=buffer_end,
            confidence=float(p.get("confidence", 0.5)),
            reason=p.get("reason", ""),
            context_relevance=p.get("context_relevance", ""),
            summary_before=p.get("summary_before", ""),
            summary_after=p.get("summary_after", "")
        )
        
        # Estimate video duration from last subtitle if not provided
        if video_duration is None and entries:
            video_duration = entries[-1].end_time
        
        return PlacementResult(
            placement=placement,
            overall_analysis=result.get("overall_analysis", ""),
            video_duration=video_duration,
            total_gaps_found=len(gaps)
        )
    
    def analyze_multipass(
        self,
        subtitle_path: str,
        video_path: str,
        user_data: dict,
        product_info: dict,
        buffer_before: int = 10,
        buffer_after: int = 3,
        num_candidates: int = 5
    ) -> PlacementResult:
        """
        Multi-pass analysis using both transcript AND visual analysis.
        
        Pass 1: Find candidate timestamps from transcript
        Pass 2: Extract frames, use Grok Vision to select best
        
        Args:
            subtitle_path: Path to SRT/VTT subtitle file.
            video_path: Path to the video file for frame extraction.
            user_data: User preferences/interests dict.
            product_info: Product/company information dict.
            buffer_before: Seconds BEFORE insertion point (default 10).
            buffer_after: Seconds AFTER insertion point (default 3).
            num_candidates: Number of candidates to evaluate.
            
        Returns:
            PlacementResult with the visually-verified optimal placement.
        """
        from frame_extractor import extract_frames_at_timestamps, frame_to_base64
        
        print("\n" + "=" * 60)
        print("MULTI-PASS AD PLACEMENT ANALYSIS")
        print("=" * 60)
        
        # Parse transcript
        entries = self.parser.parse_file(subtitle_path)
        if not entries:
            raise ValueError(f"No subtitle entries found in {subtitle_path}")
        
        # Detect gaps
        gaps = self.parser.find_gaps()
        transcript_summary = self.parser.get_transcript_summary(max_entries=100)
        
        # Format gaps for API
        gaps_data = [
            {
                "start_time": seconds_to_timestamp(g.start_time),
                "end_time": seconds_to_timestamp(g.end_time),
                "duration": g.duration,
                "context_before": g.context_before,
                "context_after": g.context_after
            }
            for g in gaps
        ]
        
        # PASS 1: Find candidates from transcript
        print(f"\n[PASS 1] Finding {num_candidates} candidate placements from transcript...")
        candidates_result = self.grok_client.find_candidate_placements(
            transcript_summary=transcript_summary,
            gaps=gaps_data,
            user_data=user_data,
            product_info=product_info,
            num_candidates=num_candidates,
            buffer_before=buffer_before,
            buffer_after=buffer_after
        )
        
        candidates = candidates_result.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates found from transcript analysis")
        
        print(f"   Found {len(candidates)} candidates:")
        for c in candidates:
            print(f"   - {c.get('insertion_point')}: {c.get('reason', '')[:60]}...")
        
        # PASS 2: Extract frames and analyze visually
        print(f"\n[PASS 2] Extracting frames and analyzing visually...")
        
        # Extract timestamps
        timestamps = [c.get("insertion_point") for c in candidates]
        
        # Create temp directory for frames
        temp_dir = tempfile.mkdtemp(prefix="ad_frames_")
        
        try:
            # Extract frames
            frame_results = extract_frames_at_timestamps(video_path, timestamps, temp_dir)
            print(f"   Extracted {len(frame_results)} frames")
            
            # Build frames data with base64
            frames_data = []
            for i, frame in enumerate(frame_results):
                candidate = candidates[i]
                frame_base64 = frame_to_base64(frame["frame_path"])
                frames_data.append({
                    "timestamp": candidate.get("insertion_point"),
                    "reason": candidate.get("reason", ""),
                    "frame_base64": frame_base64
                })
            
            # Use Grok Vision to select best
            print(f"   Sending frames to Grok Vision for analysis...")
            selection = self.grok_client.select_best_placement_from_frames(
                frames_data=frames_data,
                product_info=product_info,
                user_data=user_data
            )
            
            print(f"\n[RESULT] Selected candidate {selection.get('selected_index', 0) + 1}")
            print(f"   Timestamp: {selection.get('timestamp')}")
            print(f"   Visual: {selection.get('visual_description', '')[:80]}...")
            print(f"   Reason: {selection.get('why_selected', '')[:80]}...")
            
        finally:
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
        
        # Get the selected candidate
        selected_idx = selection.get("selected_index", 0)
        if selected_idx >= len(candidates):
            selected_idx = 0
        
        selected = candidates[selected_idx]
        
        # Calculate buffer timestamps
        insertion_point = selected.get("insertion_point", "00:00:00,000")
        try:
            insertion_seconds = timestamp_to_seconds(insertion_point)
            buffer_start = seconds_to_timestamp(max(0, insertion_seconds - buffer_before))
            buffer_end = seconds_to_timestamp(insertion_seconds + buffer_after)
        except ValueError:
            buffer_start = selected.get("buffer_start", "00:00:00,000")
            buffer_end = selected.get("buffer_end", "00:00:13,000")
        
        placement = AdPlacement(
            insertion_point=insertion_point,
            buffer_start=buffer_start,
            buffer_end=buffer_end,
            confidence=0.9,  # Higher confidence due to visual verification
            reason=selection.get("why_selected", selected.get("reason", "")),
            context_relevance=selection.get("visual_description", ""),
            summary_before=selected.get("transcript_context", ""),
            summary_after=selection.get("why_others_rejected", "")
        )
        
        # Estimate video duration
        video_duration = entries[-1].end_time if entries else None
        
        return PlacementResult(
            placement=placement,
            overall_analysis=f"Selected via multi-pass analysis. Visual verification confirmed this placement.",
            video_duration=video_duration,
            total_gaps_found=len(gaps)
        )
    
    def analyze_gaps_only(self, subtitle_path: str) -> list[dict]:
        """
        Quick analysis - just find gaps without AI analysis.
        Useful for debugging or when API is unavailable.
        
        Args:
            subtitle_path: Path to subtitle file.
            
        Returns:
            List of gap dicts.
        """
        self.parser.parse_file(subtitle_path)
        gaps = self.parser.find_gaps()
        
        return [
            {
                "timestamp_start": seconds_to_timestamp(g.start_time),
                "timestamp_end": seconds_to_timestamp(g.end_time),
                "duration": round(g.duration, 2),
                "context_before": g.context_before[-100:],
                "context_after": g.context_after[:100]
            }
            for g in gaps
        ]


def result_to_json(result: PlacementResult) -> str:
    """Convert PlacementResult to JSON string."""
    data = {
        "placement": asdict(result.placement),
        "overall_analysis": result.overall_analysis,
        "video_duration": result.video_duration,
        "total_gaps_found": result.total_gaps_found
    }
    return json.dumps(data, indent=2)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python ad_placement.py <subtitle_file> [--gaps-only]")
        sys.exit(1)
    
    subtitle_path = sys.argv[1]
    gaps_only = "--gaps-only" in sys.argv
    
    analyzer = AdPlacementAnalyzer()
    
    if gaps_only:
        # Just show detected gaps
        gaps = analyzer.analyze_gaps_only(subtitle_path)
        print(f"Found {len(gaps)} dialogue gaps:\n")
        for i, gap in enumerate(gaps[:10], 1):
            print(f"{i}. {gap['timestamp_start']} - {gap['timestamp_end']} ({gap['duration']}s)")
            print(f"   Before: ...{gap['context_before']}")
            print(f"   After: {gap['context_after']}...\n")
    else:
        # Full analysis with dummy data
        result = analyzer.analyze(
            subtitle_path=subtitle_path,
            user_data={"interests": ["comedy", "animation"], "demographics": {"age_group": "18-34"}},
            product_info={"company": "Tesla", "product": "Model 3", "category": "automotive"},
            buffer_before=10,
            buffer_after=3
        )
        print(result_to_json(result))

