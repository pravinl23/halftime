# Halftime

Grok-powered ad targeting platform. This MVP implements the User Profile Service that harvests user interests from on-site behavior and demographic-based segment priors.

## Architecture

```
frontend/          React + TypeScript + Vite
backend/           Express + TypeScript
```

## Quick Start

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Run the servers

```bash
# Terminal 1: Backend (port 3001)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend && npm run dev
```

### 3. Open the app

Visit `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Create/login user with demographics |
| `/api/events/interest` | POST | Record an interest event (user clicked something) |
| `/api/me/profile` | GET | Get computed user profile with interests |

## How It Works

1. **Login**: User logs in (demo user has demographics: 21yo, US, tags: cs_student, gamer)
2. **Behavior simulation**: Click tiles on the home page to simulate watching content
3. **Profile computation**: View inferred interests based on:
   - On-site behavior (click events)
   - X/Grok segment priors (based on demographic tags)
4. **JSON output**: See the raw profile JSON that will be fed into the ad decision engine
