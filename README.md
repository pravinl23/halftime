# Halftime

https://github.com/user-attachments/assets/a90a1640-ae86-4103-884b-4dfd0f435adb

**As Seen on CBS | [Winner @ xAI Hackathon](https://x.com/xai/status/1997875236415676619?s=20)**

AI-powered video advertising that actually works. Instead of interrupting viewers with pre-roll ads, we use AI to find natural moments in videos and seamlessly insert personalized ads that feel like part of the show.

## What It Does

Halftime analyzes videos using xAI's Grok Vision to find the perfect moment to show an ad—think natural dialogue breaks, scene transitions, or pauses in conversation. Then it uses AI to insert the ad so smoothly that viewers barely notice the transition.

**For Viewers:**
- Watch your favorite shows with ads that don't suck
- Ads appear at natural moments (not mid-sentence)
- Personalized based on your interests via X API
- Seamless playback—no buffering, no interruptions

**For Advertisers:**
- Real-time analytics dashboard
- Context-aware ad placement (right audience, right moment)
- Performance metrics: CTR, engagement, conversions
- Campaign management tools

## How It Works

1. **AI Analysis:** Grok Vision analyzes the video transcript + frames to find high-attention moments
2. **Smart Placement:** AI scores candidate moments based on context, user interests, and visual flow
3. **Seamless Insertion:** Hardware-accelerated video processing inserts ads without re-encoding the entire video
4. **Real-Time Streaming:** HLS streaming with dynamic playlist updates—viewers can start watching immediately

## Tech Stack

**Frontend:**
- Next.js 16 + React 19 + TypeScript
- Custom HLS video player with real-time ad markers
- Tailwind CSS for responsive design
- Recharts for analytics visualization

**Backend:**
- Python 3.13 + FastAPI for high-performance API
- FFmpeg hardware acceleration (VideoToolbox)
- Supabase for auth + database
- Real-time HLS streaming

**AI & APIs:**
- xAI Grok Vision (video + transcript analysis)
- WaveSpeed AI (video generation)
- X API (audience personalization)
- OMDb (movie metadata)

## Key Features

- **Two-Stage AI Analysis:** Transcript parsing + visual verification for optimal placement
- **Hardware Acceleration:** 3-5 minute processing for 43-minute videos
- **Dual Frontends:** Viewer platform + advertiser dashboard
- **Real-Time Analytics:** Track impressions, clicks, conversions, engagement
- **Personalized Targeting:** Uses X API signals for context-aware ads
- **Zero-Wait Streaming:** Watch while processing happens in background

## Performance

- Processes 43-minute videos in **3-5 minutes** with hardware acceleration
- Dynamic HLS playlist updates for seamless viewing
- Real-time ad tracking and analytics
- Multi-tenant architecture supporting multiple advertisers

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Viewer App (Next.js)   |  Dashboard (Next.js) │
│  - Video Player          |  - Analytics         │
│  - Ad Tracking           |  - Campaigns         │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  FastAPI Backend  │
         │  - Auth           │
         │  - Video Jobs     │
         │  - HLS Streaming  │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐   ┌─────▼─────┐     ┌───▼────┐
│ Grok  │   │ WaveSpeed │     │   X    │
│ Vision│   │ AI (Wan2) │     │  API   │
└───────┘   └───────────┘     └────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.13+
- FFmpeg installed

### Environment Setup
```bash
# Required API keys
XAI_API_KEY=your_grok_api_key
WAVESPEED_API_KEY=your_wavespeed_key
X_BEARER_TOKEN=your_x_api_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
```

### Run Viewer Platform
```bash
cd frontend/xvideos
npm install
npm run dev
```

### Run Dashboard
```bash
cd frontend/dashboard
npm install
npm run dev
```

### Run Backend API
```bash
cd backend/dashboard
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Why Halftime?

Traditional video ads are broken:
- ❌ Pre-roll ads annoy viewers before content even starts
- ❌ Mid-roll ads interrupt at random, jarring moments
- ❌ Static ads ignore viewer preferences and context
- ❌ Poor targeting leads to wasted ad spend

Halftime fixes this:
- ✅ AI finds natural moments that don't disrupt flow
- ✅ Visual verification ensures placements make sense
- ✅ Personalized targeting based on user interests
- ✅ Real-time analytics for advertisers
- ✅ Seamless viewing experience for audiences


Built with ❤️ using xAI Grok Vision, Next.js, Python, and a lot of FFmpeg magic.
