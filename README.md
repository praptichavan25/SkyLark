# ✈️ SkyLark — Flight Data Exploration & Aviation Route Intelligence

A full-stack aviation intelligence platform featuring interactive flight network exploration, multi-stop route calculation, aircraft range analysis, and animated flight trajectories.

---

## 🏛️ Architecture Overview

SkyLark is structured as a **single-root full-stack application** with npm workspaces:

```
SkyLark/
├── frontend/             # React 19 + TypeScript + Vite + GSAP + Lucide
│   ├── src/
│   │   ├── components/   # SkyRouteExplorer, FlightSearchSky, Analytics, etc.
│   │   ├── dsa/          # Client-side Graph, Tree, Queue, Stack implementations
│   │   ├── services/     # API client interacting with /api
│   │   └── data/         # Offline airport & fleet fallback data
│   └── vite.config.ts    # Configured with proxy to backend for local development
│
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/       # Environment & path resolution (0.0.0.0 on Render)
│   │   ├── controllers/  # Route calculation, airport, and search controllers
│   │   ├── services/     # RouteEngine, Great Circle math, persistence
│   │   ├── routes/       # /api/health, /api/routes, /api/airports, /api/flights
│   │   └── server.ts     # Express server; serves static frontend in production
│   └── tests/            # Automated test suite for Route Engine
│
├── render.yaml           # Blueprint for one-service Render deployment
├── package.json          # Root package with unified workspace scripts
└── .env.example          # Environment variable template
```

In **production** (e.g. deployed to Render), Express serves the pre-built React frontend from `frontend/dist` and handles API requests under `/api/*` on a single port. In **development**, Vite serves the frontend with hot reload while proxying `/api` requests to the Express backend.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd SkyLark
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Optionally provide your `AVIATIONSTACK_API_KEY` for live flight feeds; mock data is used automatically when omitted).*

### 3. Run Both Frontend & Backend Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://127.0.0.1:5005](http://127.0.0.1:5005)
- **Health Check**: [http://127.0.0.1:5005/api/health](http://127.0.0.1:5005/api/health)

---

## 🛠️ Root Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both backend (`tsx watch`) and frontend (`vite`) concurrently |
| `npm run dev:backend` | Runs only the backend in watch mode |
| `npm run dev:frontend` | Runs only the Vite frontend dev server |
| `npm run build` | Builds both frontend (`vite build`) and backend (`tsc`) |
| `npm run start` | Runs the production backend (serves API + built frontend) |
| `npm run test` | Executes the complete test suite |
| `npm run lint` | Runs frontend code linting |

---

## 🧪 Testing

Run the automated backend test suite:
```bash
npm run test
```

Tests verify:
- Direct flight route calculations
- Multi-stop stopover canonical sequencing and leg reordering
- Aircraft range checks (Boeing 787-9, Airbus A350-900, Embraer E195-E2)
- Input validations (invalid codes, consecutive duplicate airports)
- Great circle distance calculations
- Route persistence and retrieval by ID

---

## 🌐 Production Deployment (Render)

SkyLark is configured to deploy to **Render** as a single **Web Service**.

### Method 1: Render Blueprint (Recommended)
1. Push your repository to GitHub / GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New** → **Blueprint**.
4. Connect this repository. Render automatically reads [`render.yaml`](file:///Users/praptichavan/Desktop/SkyLark/render.yaml) and configures the service.
5. Click **Apply**.

### Method 2: Manual Web Service Setup
1. In the Render Dashboard, click **New** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)
   - `AVIATIONSTACK_API_KEY`: *(Optional)*
5. Deploy.

---

## 📡 API Reference

### Health Check
- `GET /api/health`
  - Returns server uptime, memory usage, environment mode, and timestamp.

### Route Engine
- `POST /api/routes/calculate`
  - Calculates multi-leg flight route with coordinates, bearing, distance, fuel consumption, and duration.
  - Body:
    ```json
    {
      "origin": "JFK",
      "destination": "LHR",
      "stopovers": ["BOS"],
      "aircraftId": "e195-e2"
    }
    ```
- `POST /api/routes/save`
  - Saves a calculated route to memory/session store.
- `GET /api/routes/:id`
  - Retrieves a previously saved route.
- `GET /api/routes/fleet/aircraft`
  - Lists all 3 supported aircraft models with specifications and ranges.

### Airports & Flights
- `GET /api/airports` — List indexed international airports
- `GET /api/flights` — Search scheduled and simulated flights

---

## ✈️ Supported Fleet
1. **Boeing 787-9 Dreamliner** — Long-haul flagship (14,140 km range)
2. **Airbus A350-900** — Ultra-long-haul efficiency (15,000 km range)
3. **Embraer E195-E2** — High-efficiency regional jet (4,815 km range)
