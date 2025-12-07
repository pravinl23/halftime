"""
Transcript Parser for SRT/VTT subtitle files.

Parses subtitle files and detects natural gaps/pauses in dialogue
that could serve as ad placement opportunities.
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class SubtitleEntry:
    """Represents a single subtitle entry."""
    index: int
    start_time: float  # in seconds
    end_time: float    # in seconds
    text: str
    
    def duration(self) -> float:
        return self.end_time - self.start_time


@dataclass
class DialogueGap:
    """Represents a gap between dialogue entries."""
    start_time: float  # in seconds
    end_time: float    # in seconds
    duration: float    # in seconds
    context_before: str  # text before the gap
    context_after: str   # text after the gap
    
    def to_timestamp(self, seconds: float) -> str:
        """Convert seconds to HH:MM:SS,mmm format."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


class TranscriptParser:
    """Parser for SRT and VTT subtitle files."""
    
    def __init__(self, min_gap_duration: float = 1.5):
        """
        Initialize the parser.
        
        Args:
            min_gap_duration: Minimum gap duration (in seconds) to consider
                             as a potential ad placement. Default 1.5s.
        """
        self.min_gap_duration = min_gap_duration
        self.entries: list[SubtitleEntry] = []
        self.gaps: list[DialogueGap] = []
    
    def parse_srt_time(self, time_str: str) -> float:
        """
        Parse SRT timestamp to seconds.
        Format: HH:MM:SS,mmm or HH:MM:SS.mmm
        """
        # Handle both comma and period as millisecond separator
        time_str = time_str.replace(',', '.')
        
        match = re.match(r'(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})', time_str)
        if match:
            hours, minutes, seconds, ms = map(int, match.groups())
            return hours * 3600 + minutes * 60 + seconds + ms / 1000
        
        # Try without milliseconds
        match = re.match(r'(\d{1,2}):(\d{2}):(\d{2})', time_str)
        if match:
            hours, minutes, seconds = map(int, match.groups())
            return hours * 3600 + minutes * 60 + seconds
        
        raise ValueError(f"Unable to parse time: {time_str}")
    
    def parse_vtt_time(self, time_str: str) -> float:
        """
        Parse VTT timestamp to seconds.
        Format: HH:MM:SS.mmm or MM:SS.mmm
        """
        time_str = time_str.strip()
        
        # Full format: HH:MM:SS.mmm
        match = re.match(r'(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})', time_str)
        if match:
            hours, minutes, seconds, ms = map(int, match.groups())
            return hours * 3600 + minutes * 60 + seconds + ms / 1000
        
        # Short format: MM:SS.mmm
        match = re.match(r'(\d{1,2}):(\d{2})\.(\d{3})', time_str)
        if match:
            minutes, seconds, ms = map(int, match.groups())
            return minutes * 60 + seconds + ms / 1000
        
        raise ValueError(f"Unable to parse VTT time: {time_str}")
    
    def parse_file(self, filepath: str) -> list[SubtitleEntry]:
        """
        Parse a subtitle file (SRT or VTT).
        
        Args:
            filepath: Path to the subtitle file.
            
        Returns:
            List of SubtitleEntry objects.
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Detect format
        if filepath.lower().endswith('.vtt') or content.startswith('WEBVTT'):
            return self._parse_vtt(content)
        else:
            return self._parse_srt(content)
    
    def _parse_srt(self, content: str) -> list[SubtitleEntry]:
        """Parse SRT format content."""
        entries = []
        
        # Split into blocks (separated by blank lines)
        blocks = re.split(r'\n\s*\n', content.strip())
        
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) < 3:
                continue
            
            try:
                # First line is index
                index = int(lines[0].strip())
                
                # Second line is timestamp
                time_match = re.match(
                    r'(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})',
                    lines[1].strip()
                )
                if not time_match:
                    continue
                
                start_time = self.parse_srt_time(time_match.group(1))
                end_time = self.parse_srt_time(time_match.group(2))
                
                # Rest is text (may span multiple lines)
                text = ' '.join(lines[2:]).strip()
                # Clean up HTML tags and special characters
                text = re.sub(r'<[^>]+>', '', text)
                text = text.replace('\n', ' ')
                
                entries.append(SubtitleEntry(
                    index=index,
                    start_time=start_time,
                    end_time=end_time,
                    text=text
                ))
            except (ValueError, IndexError):
                continue
        
        self.entries = sorted(entries, key=lambda e: e.start_time)
        return self.entries
    
    def _parse_vtt(self, content: str) -> list[SubtitleEntry]:
        """Parse VTT format content."""
        entries = []
        
        # Remove WEBVTT header and metadata
        content = re.sub(r'^WEBVTT.*?\n\n', '', content, flags=re.DOTALL)
        
        # Split into cue blocks
        blocks = re.split(r'\n\s*\n', content.strip())
        
        index = 0
        for block in blocks:
            lines = block.strip().split('\n')
            if not lines:
                continue
            
            # Find timestamp line
            time_line_idx = 0
            for i, line in enumerate(lines):
                if '-->' in line:
                    time_line_idx = i
                    break
            else:
                continue
            
            try:
                time_match = re.match(
                    r'([\d:\.]+)\s*-->\s*([\d:\.]+)',
                    lines[time_line_idx].strip()
                )
                if not time_match:
                    continue
                
                start_time = self.parse_vtt_time(time_match.group(1))
                end_time = self.parse_vtt_time(time_match.group(2))
                
                # Text is after timestamp line
                text = ' '.join(lines[time_line_idx + 1:]).strip()
                text = re.sub(r'<[^>]+>', '', text)
                text = text.replace('\n', ' ')
                
                index += 1
                entries.append(SubtitleEntry(
                    index=index,
                    start_time=start_time,
                    end_time=end_time,
                    text=text
                ))
            except (ValueError, IndexError):
                continue
        
        self.entries = sorted(entries, key=lambda e: e.start_time)
        return self.entries
    
    def find_gaps(self, min_duration: Optional[float] = None) -> list[DialogueGap]:
        """
        Find gaps between dialogue entries.
        
        Args:
            min_duration: Minimum gap duration to include. 
                         Defaults to self.min_gap_duration.
        
        Returns:
            List of DialogueGap objects representing pauses in dialogue.
        """
        if min_duration is None:
            min_duration = self.min_gap_duration
        
        gaps = []
        
        for i in range(len(self.entries) - 1):
            current = self.entries[i]
            next_entry = self.entries[i + 1]
            
            gap_duration = next_entry.start_time - current.end_time
            
            if gap_duration >= min_duration:
                # Get context (up to 3 entries before and after)
                context_before_entries = self.entries[max(0, i-2):i+1]
                context_after_entries = self.entries[i+1:min(len(self.entries), i+4)]
                
                context_before = ' '.join([e.text for e in context_before_entries])
                context_after = ' '.join([e.text for e in context_after_entries])
                
                gaps.append(DialogueGap(
                    start_time=current.end_time,
                    end_time=next_entry.start_time,
                    duration=gap_duration,
                    context_before=context_before,
                    context_after=context_after
                ))
        
        self.gaps = sorted(gaps, key=lambda g: g.duration, reverse=True)
        return self.gaps
    
    def get_full_transcript(self) -> str:
        """Get the full transcript as a single string with timestamps."""
        lines = []
        for entry in self.entries:
            timestamp = DialogueGap.to_timestamp(None, entry.start_time)
            lines.append(f"[{timestamp}] {entry.text}")
        return '\n'.join(lines)
    
    def get_transcript_summary(self, max_entries: int = 50) -> str:
        """
        Get a summarized transcript for LLM context.
        Samples entries evenly across the video.
        """
        if len(self.entries) <= max_entries:
            return self.get_full_transcript()
        
        # Sample evenly
        step = len(self.entries) // max_entries
        sampled = self.entries[::step][:max_entries]
        
        lines = []
        for entry in sampled:
            timestamp = DialogueGap.to_timestamp(None, entry.start_time)
            lines.append(f"[{timestamp}] {entry.text}")
        return '\n'.join(lines)


def seconds_to_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS,mmm format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def timestamp_to_seconds(timestamp: str) -> float:
    """Convert HH:MM:SS,mmm or HH:MM:SS format to seconds."""
    timestamp = timestamp.replace(',', '.')
    
    match = re.match(r'(\d{1,2}):(\d{2}):(\d{2})\.?(\d{3})?', timestamp)
    if match:
        hours, minutes, seconds = int(match.group(1)), int(match.group(2)), int(match.group(3))
        ms = int(match.group(4)) if match.group(4) else 0
        return hours * 3600 + minutes * 60 + seconds + ms / 1000
    
    raise ValueError(f"Unable to parse timestamp: {timestamp}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python transcript_parser.py <subtitle_file>")
        sys.exit(1)
    
    parser = TranscriptParser(min_gap_duration=1.5)
    entries = parser.parse_file(sys.argv[1])
    
    print(f"Parsed {len(entries)} subtitle entries")
    print(f"\nFirst 5 entries:")
    for entry in entries[:5]:
        print(f"  [{seconds_to_timestamp(entry.start_time)}] {entry.text[:50]}...")
    
    gaps = parser.find_gaps()
    print(f"\nFound {len(gaps)} gaps >= {parser.min_gap_duration}s")
    print(f"\nTop 5 largest gaps:")
    for gap in gaps[:5]:
        print(f"  {seconds_to_timestamp(gap.start_time)} - {seconds_to_timestamp(gap.end_time)} ({gap.duration:.2f}s)")
        print(f"    Before: ...{gap.context_before[-50:]}") 
        print(f"    After: {gap.context_after[:50]}...")



