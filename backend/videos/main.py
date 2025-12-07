"""
Ad Placement & Video Processing Pipeline - Main Entry Point

This module orchestrates the complete ad placement pipeline:
1. Takes input JSON with video info, user data, and product info
2. Parses subtitles and detects dialogue gaps
3. Uses Grok AI to find the optimal ad placement timestamp
4. Processes the video: extracts segment, applies edits, reinserts

Usage:
    python main.py <input_json_path>
    python main.py --inline '{"subtitle_path": "...", ...}'
    python main.py <input_json_path> --process  # Also process the video
    
    Or import and use programmatically:
    from main import find_ad_placement, process_ad_placement
    result = find_ad_placement(input_data)
    output_video = process_ad_placement(input_data)
"""
# Previous: The video continues smoothly. A {product_name} appears naturally in the scene, blending seamlessly with the environment. The {product_category} product is visible but feels like it belongs. Keep the original visual style and mood.

import sys
import json
import argparse
from typing import Union, Optional
from pathlib import Path

from ad_placement import AdPlacementAnalyzer, result_to_json, PlacementResult
from process_video import process_video


def find_ad_placement(
    input_data: Union[dict, str, Path],
    buffer_before: int = 10,
    buffer_after: int = 3,
    multipass: bool = False,
    num_candidates: int = 5
) -> dict:
    """
    Find the optimal ad placement timestamp for a video.
    
    Args:
        input_data: Either a dict or path to JSON file containing:
            - subtitle_path: Path to SRT/VTT subtitle file (required)
            - video_path: Path to video file (required for multipass)
            - user_data: User preferences from X API (optional)
            - product: Product/company info to advertise (required)
        buffer_before: Seconds BEFORE insertion point (default 10s).
        buffer_after: Seconds AFTER insertion point (default 3s).
        multipass: If True, use visual analysis to verify placement.
        num_candidates: Number of candidates to evaluate in multipass mode.
        
    Returns:
        Dict with the optimal placement.
    """
    # Load input data
    if isinstance(input_data, (str, Path)):
        with open(input_data, 'r') as f:
            data = json.load(f)
    else:
        data = input_data
    
    # Validate required fields
    if 'subtitle_path' not in data:
        raise ValueError("Missing required field: subtitle_path")
    if 'product' not in data:
        raise ValueError("Missing required field: product")
    
    # Extract fields with defaults
    subtitle_path = data['subtitle_path']
    video_path = data.get('video_path')
    user_data = data.get('user_data', {
        'interests': [],
        'demographics': {}
    })
    product_info = data['product']
    
    # Override buffers if specified in input
    if 'buffer_before' in data:
        buffer_before = data['buffer_before']
    if 'buffer_after' in data:
        buffer_after = data['buffer_after']
    # Legacy support
    if 'buffer_seconds' in data:
        buffer_before = data['buffer_seconds']
        buffer_after = 3  # Default to 3 for AI mode
    
    # Run analysis
    analyzer = AdPlacementAnalyzer()
    
    if multipass:
        # Multi-pass: transcript + visual verification
        if not video_path:
            raise ValueError("video_path is required for multi-pass analysis")
        
        result = analyzer.analyze_multipass(
            subtitle_path=subtitle_path,
            video_path=video_path,
            user_data=user_data,
            product_info=product_info,
            buffer_before=buffer_before,
            buffer_after=buffer_after,
            num_candidates=num_candidates
        )
    else:
        # Single-pass: transcript only
        result = analyzer.analyze(
            subtitle_path=subtitle_path,
            user_data=user_data,
            product_info=product_info,
            buffer_before=buffer_before,
            buffer_after=buffer_after
        )
    
    # Convert to dict (full output for verification)
    p = result.placement
    return {
        "placement": {
            "insertion_point": p.insertion_point,
            "buffer_start": p.buffer_start,
            "buffer_end": p.buffer_end,
            "confidence": p.confidence,
            "reason": p.reason,
            "context_relevance": p.context_relevance,
            "summary_before": p.summary_before,
            "summary_after": p.summary_after
        },
        "overall_analysis": result.overall_analysis,
        "video_duration": result.video_duration,
        "total_gaps_found": result.total_gaps_found,
        "multipass": multipass,
        "input": {
            "subtitle_path": subtitle_path,
            "video_path": video_path,
            "product": product_info,
            "user_interests": user_data.get('interests', [])
        }
    }


def process_ad_placement(
    input_data: Union[dict, str, Path],
    buffer_before: int = 10,
    buffer_after: int = 3,
    speed_factor: float = 0.8,
    output_path: Optional[str] = None,
    use_ai: bool = False,
    multipass: bool = False,
    num_candidates: int = 5
) -> dict:
    """
    Find optimal ad placement AND process the video.
    
    This is the complete pipeline:
    1. Find the best ad placement timestamp (optionally with visual verification)
    2. Extract the segment at buffer_start to buffer_end
    3. Apply edits (AI generation or placeholder effects)
    4. Reinsert the edited segment into the original video
    
    Args:
        input_data: Either a dict or path to JSON file
        buffer_before: Seconds BEFORE insertion point (default 10s)
        buffer_after: Seconds AFTER insertion point (default 3s for AI mode)
        speed_factor: Speed factor for placeholder edit (0.8 = slower)
        output_path: Path for output video (optional)
        use_ai: Whether to use AI video generation (WaveSpeed)
        multipass: Whether to use visual verification for placement
        num_candidates: Number of candidates to evaluate in multipass mode
        
    Returns:
        Dict with placement info and output video path
    """
    # First, find the placement (with or without visual verification)
    result = find_ad_placement(input_data, buffer_before, buffer_after, multipass, num_candidates)
    
    # Get data from input
    if isinstance(input_data, (str, Path)):
        with open(input_data, 'r') as f:
            data = json.load(f)
    else:
        data = input_data
    
    video_path = data.get('video_path')
    if not video_path:
        raise ValueError("video_path is required for video processing")
    
    # Process the video using buffer_start and buffer_end
    buffer_start = result['placement']['buffer_start']
    buffer_end = result['placement']['buffer_end']
    
    print("\n" + "=" * 60)
    print("PROCESSING VIDEO WITH AD PLACEMENT")
    print("=" * 60)
    print(f"Buffer range: {buffer_start} to {buffer_end}")
    print(f"Mode: {'AI Generation' if use_ai else 'Placeholder'}")
    print("=" * 60 + "\n")
    
    # Build context for AI generation
    context = None
    if use_ai:
        context = {
            'product_info': data.get('product', {}),
            'summary_before': result['placement'].get('summary_before', ''),
            'summary_after': result['placement'].get('summary_after', ''),
            'user_data': data.get('user_data', {}),
            'content_type': data.get('content_type', 'TV Show'),
            'content_genre': data.get('content_genre', 'Comedy')
        }
        print("AI Context:")
        print(f"  Product: {context['product_info'].get('product')} by {context['product_info'].get('company')}")
        summary_before = str(context.get('summary_before', '') or '')
        summary_after = str(context.get('summary_after', '') or '')
        print(f"  Summary Before: {summary_before[:100]}...")
        print(f"  Summary After: {summary_after[:100]}...")
        print("")
    
    # Run the video processing pipeline
    output_video = process_video(
        input_path=video_path,
        start_time=buffer_start,
        end_time=buffer_end,
        speed_factor=speed_factor,
        output_path=output_path,
        use_ai=use_ai,
        context=context
    )
    
    # Add output video path to result
    result['output_video'] = output_video
    
    return result


def find_gaps_only(subtitle_path: str) -> dict:
    """
    Find dialogue gaps without AI analysis.
    Useful for testing or when API is unavailable.
    
    Args:
        subtitle_path: Path to subtitle file.
        
    Returns:
        Dict with gap information.
    """
    analyzer = AdPlacementAnalyzer()
    gaps = analyzer.analyze_gaps_only(subtitle_path)
    
    return {
        "subtitle_path": subtitle_path,
        "gaps": gaps,
        "total_gaps": len(gaps)
    }


def main():
    parser = argparse.ArgumentParser(
        description="Find optimal ad placement and optionally process the video"
    )
    parser.add_argument(
        'input',
        nargs='?',
        help="Path to input JSON file"
    )
    parser.add_argument(
        '--inline',
        type=str,
        help="Inline JSON input (alternative to file path)"
    )
    parser.add_argument(
        '--gaps-only',
        type=str,
        metavar='SUBTITLE_PATH',
        help="Only find dialogue gaps (no AI analysis)"
    )
    parser.add_argument(
        '--process',
        action='store_true',
        help="Also process the video (extract, edit, reinsert)"
    )
    parser.add_argument(
        '--ai',
        action='store_true',
        help="Use AI video generation (WaveSpeed) instead of placeholder"
    )
    parser.add_argument(
        '--buffer-before',
        type=int,
        default=10,
        help="Buffer seconds BEFORE insertion point (default: 10)"
    )
    parser.add_argument(
        '--buffer-after',
        type=int,
        default=3,
        help="Buffer seconds AFTER insertion point (default: 3 - works better with AI video-extend)"
    )
    parser.add_argument(
        '--speed',
        type=float,
        default=0.8,
        help="Speed factor for placeholder video edit (default: 0.8 = slower)"
    )
    parser.add_argument(
        '--output',
        type=str,
        help="Output file path (JSON result or video if --process)"
    )
    parser.add_argument(
        '--multipass',
        action='store_true',
        help="Use multi-pass analysis: find candidates from transcript, then verify with Grok Vision"
    )
    parser.add_argument(
        '--candidates',
        type=int,
        default=5,
        help="Number of candidates to evaluate in multi-pass mode (default: 5)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.gaps_only:
            result = find_gaps_only(args.gaps_only)
        elif args.inline:
            input_data = json.loads(args.inline)
            if args.process:
                result = process_ad_placement(
                    input_data, args.buffer_before, args.buffer_after, args.speed, 
                    args.output, args.ai, args.multipass, args.candidates
                )
            else:
                result = find_ad_placement(input_data, args.buffer_before, args.buffer_after, args.multipass, args.candidates)
        elif args.input:
            if args.process:
                result = process_ad_placement(
                    args.input, args.buffer_before, args.buffer_after, args.speed, 
                    args.output, args.ai, args.multipass, args.candidates
                )
            else:
                result = find_ad_placement(args.input, args.buffer_before, args.buffer_after, args.multipass, args.candidates)
        else:
            parser.print_help()
            print("\n--- Example Input JSON ---")
            print(json.dumps({
                "subtitle_path": "path/to/subtitles.srt",
                "video_path": "path/to/video.mp4",
                "user_data": {
                    "interests": ["tech", "gaming", "comedy"],
                    "demographics": {
                        "age_group": "18-34",
                        "location": "US"
                    }
                },
                "product": {
                    "company": "Apple",
                    "product": "iPhone 15",
                    "category": "electronics"
                },
                "buffer_seconds": 10
            }, indent=2))
            print("\n--- Example Output JSON ---")
            print(json.dumps({
                "placement": {
                    "insertion_point": "00:12:56,985",
                    "buffer_start": "00:12:46,985",
                    "buffer_end": "00:13:06,985",
                    "confidence": 0.92,
                    "reason": "Natural 18.5s pause after TV channel switch scene",
                    "context_relevance": "Scene transition provides natural break",
                    "summary_before": "The TV host announces switching to 'Puppies From Around the World'",
                    "summary_after": "Characters react to the Chinese puppy segment"
                },
                "overall_analysis": "Best placement found at scene transition...",
                "video_duration": 1260.5,
                "total_gaps_found": 39,
                "input": {
                    "subtitle_path": "path/to/subtitles.srt",
                    "video_path": "path/to/video.mp4",
                    "product": {"company": "Apple", "product": "iPhone 15", "category": "electronics"},
                    "user_interests": ["tech", "gaming", "comedy"]
                }
            }, indent=2))
            sys.exit(0)
        
        # Output result
        output_json = json.dumps(result, indent=2)
        
        if args.output and not args.process:
            with open(args.output, 'w') as f:
                f.write(output_json)
            print(f"Results written to {args.output}")
        else:
            print(output_json)
            
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

