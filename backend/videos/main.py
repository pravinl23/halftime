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

import sys
import json
import argparse
from typing import Union, Optional
from pathlib import Path

from ad_placement import AdPlacementAnalyzer, result_to_json, PlacementResult
from process_video import process_video
from x_api_client import get_enriched_user_profile, match_user_to_products
from grok_client import GrokClient


def find_ad_placement(
    input_data: Union[dict, str, Path],
    buffer_seconds: int = 10
) -> dict:
    """
    Find the optimal ad placement timestamp for a video.
    
    Args:
        input_data: Either a dict or path to JSON file containing:
            - subtitle_path: Path to SRT/VTT subtitle file (required)
            - video_path: Path to video file (optional, for reference)
            - user_data: User preferences from X API (optional)
            - product: Product/company info to advertise (required)
        buffer_seconds: Buffer before/after insertion point (default 10s).
        
    Returns:
        Dict with the optimal placement:
        {
            "placement": {
                "insertion_point": "HH:MM:SS,mmm",
                "buffer_start": "HH:MM:SS,mmm",
                "buffer_end": "HH:MM:SS,mmm",
                "confidence": 0.0-1.0,
                "reason": "...",
                "context_relevance": "...",
                "summary_before": "...",
                "summary_after": "..."
            },
            "overall_analysis": "...",
            "video_duration": float,
            "total_gaps_found": int
        }
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
    # Product can be optional if available_products is provided
    
    # Extract fields with defaults
    subtitle_path = data['subtitle_path']
    video_path = data.get('video_path')
    product_info = data.get('product')
    
    # Get platform data (age, shows, cookies, location, etc.)
    platform_data = {
        'age': data.get('age'),
        'shows': data.get('shows', []),
        'cookies': data.get('cookies', {}),
        'location': data.get('location'),
        'interests': data.get('user_data', {}).get('interests', []),
        'demographics': data.get('user_data', {}).get('demographics', {})
    }
    
    # Remove None values
    platform_data = {k: v for k, v in platform_data.items() if v is not None and v != {}}
    
    x_username = data.get('x_username')  # Optional X username to fetch
    
    # Always use Grok to analyze and enrich user data (NO FALLBACKS)
    print("Analyzing user data with Grok AI...")
    grok = GrokClient()
    enriched_profile = get_enriched_user_profile(
        platform_data=platform_data,
        x_username=x_username,
        grok_client=grok
    )
    
    # Convert to user_data format for ad placement
    user_data = {
        'interests': enriched_profile.get('interests', []),
        'demographics': enriched_profile.get('demographics', {}),
        'content_preferences': enriched_profile.get('content_preferences', []),
        'values': enriched_profile.get('values', []),
        'product_affinities': enriched_profile.get('product_affinities', [])
    }
    
    # If product not specified, use Grok to match user to best product
    if not product_info:
        available_products = data.get('available_products', [])
        if available_products:
            print("No product specified - matching user to best product with Grok...")
            matches = match_user_to_products(enriched_profile, available_products, grok)
            best_match = matches.get('best_match', {})
            if best_match:
                product_info = best_match.get('product', {})
                print(f"  Selected: {product_info.get('product')} by {product_info.get('company')}")
            else:
                raise ValueError("No product match found. Please specify a product or provide available_products.")
        else:
            raise ValueError("No product specified and no available_products provided.")
    
    # Override buffer_seconds if specified in input
    if 'buffer_seconds' in data:
        buffer_seconds = data['buffer_seconds']
    
    # Run analysis
    analyzer = AdPlacementAnalyzer()
    result = analyzer.analyze(
        subtitle_path=subtitle_path,
        user_data=user_data,
        product_info=product_info,
        buffer_seconds=buffer_seconds
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
        "input": {
            "subtitle_path": subtitle_path,
            "video_path": video_path,
            "product": product_info,
            "user_interests": user_data.get('interests', [])
        }
    }


def process_ad_placement(
    input_data: Union[dict, str, Path],
    buffer_seconds: int = 10,
    speed_factor: float = 0.8,
    output_path: Optional[str] = None,
    use_ai: bool = False
) -> dict:
    """
    Find optimal ad placement AND process the video.
    
    This is the complete pipeline:
    1. Find the best ad placement timestamp
    2. Extract the segment at buffer_start to buffer_end
    3. Apply edits (AI generation or placeholder effects)
    4. Reinsert the edited segment into the original video
    
    Args:
        input_data: Either a dict or path to JSON file
        buffer_seconds: Buffer before/after insertion point (default 10s)
        speed_factor: Speed factor for placeholder edit (0.8 = slower)
        output_path: Path for output video (optional)
        use_ai: Whether to use AI video generation (WaveSpeed)
        
    Returns:
        Dict with placement info and output video path
    """
    # First, find the placement
    result = find_ad_placement(input_data, buffer_seconds)
    
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
        print(f"  Summary Before: {context['summary_before'][:100]}...")
        print(f"  Summary After: {context['summary_after'][:100]}...")
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
        '--buffer',
        type=int,
        default=10,
        help="Buffer seconds before/after insertion point (default: 10)"
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
        '--x-user',
        type=str,
        metavar='USERNAME',
        help="X/Twitter username to fetch user data from (without @)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.gaps_only:
            result = find_gaps_only(args.gaps_only)
        elif args.inline:
            input_data = json.loads(args.inline)
            # Inject X user from CLI args
            if args.x_user:
                input_data['x_username'] = args.x_user
            if args.process:
                result = process_ad_placement(input_data, args.buffer, args.speed, args.output, args.ai)
            else:
                result = find_ad_placement(input_data, args.buffer)
        elif args.input:
            # Load and potentially modify input data
            with open(args.input, 'r') as f:
                input_data = json.load(f)
            if args.x_user:
                input_data['x_username'] = args.x_user
            if args.process:
                result = process_ad_placement(input_data, args.buffer, args.speed, args.output, args.ai)
            else:
                result = find_ad_placement(input_data, args.buffer)
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

