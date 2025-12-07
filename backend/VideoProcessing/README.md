# Video Segment Extractor

A Python script to extract segments from MP4 video files based on start and end times.

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

**Note:** `moviepy` requires `ffmpeg` to be installed on your system. 

### Installing ffmpeg:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Usage

### Command Line

```bash
python extract_segment.py <input_video> <start_time> <end_time> [output_video]
```

### Examples

```bash
# Using seconds
python extract_segment.py ../data/SouthParkVeal.mp4 60 120

# Using HH:MM:SS format
python extract_segment.py ../data/SouthParkVeal.mp4 00:01:00 00:02:00

# Using SRT format (HH:MM:SS,mmm)
python extract_segment.py ../data/SouthParkVeal.mp4 00:01:00,500 00:02:00,750

# Specify output file
python extract_segment.py ../data/SouthParkVeal.mp4 60 120 output_segment.mp4
```

### As a Python Module

```python
from extract_segment import extract_segment

# Extract segment using seconds
output = extract_segment(
    input_path="../data/SouthParkVeal.mp4",
    start_time=60.5,
    end_time=120.0,
    output_path="segment.mp4"
)

# Extract segment using SRT format
output = extract_segment(
    input_path="../data/SouthParkVeal.mp4",
    start_time="00:01:00,500",
    end_time="00:02:00,750"
)
```

## Time Format Support

The script supports multiple time formats:

- **Seconds** (float): `60.5`, `120.0`
- **HH:MM:SS**: `00:01:00`, `01:30:45`
- **SRT format**: `00:01:00,500` (hours:minutes:seconds,milliseconds)

## Features

- Multiple time format support
- Automatic output filename generation
- Validates input times against video duration
- Preserves video and audio quality
- Error handling and informative messages

