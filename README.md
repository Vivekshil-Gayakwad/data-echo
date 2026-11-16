# 🌐 Data Echo — Real-Time Information Verification & DSA Propagation Platform

**Data Echo** is an advanced verification and graph propagation intelligence platform designed to ingest claims, search real-time internet sources (Google News, Wikipedia, Official Authority Portals), trace the earliest known publisher, and simulate information cascades using classical Graph Data Structures and Algorithms (DSA).

---

## ⚡ Core Features & Graph Algorithms

1. **Real-Time Internet Verification Engine**:
   - Searches live sources across 8 authority categories (Government, Natural Disasters, College, Health, Politics, Crime, Sports, Finance).
   - Real Publisher & Source Name Identification (e.g., *Reuters*, *The Hindu*, *BBC News*, *PIB*, *Wikipedia*, or *Origin Unknown*).
   - **DSA String Similarity**: Dynamic Programming Levenshtein Distance Matrix ($O(m \times n)$).
   - **DSA Jaccard Similarity**: Set intersection over union of word n-grams.
   - **DSA Cryptographic Hashing**: SHA-256 for duplicate and exact claim detection.
   - **Earliest Known Source Tracing**: Chronological publication timestamp sorting ($t_0 \le t_1 \le \dots \le t_n$).
   - **Attribution DAG Extraction**: Directed Acyclic Graph tracing citations and repost links.
   - **Rule-Based Verdict Engine**: Supported, Contradicted, Misleading, or Unverified with transparent evidence badges.

2. **Source & Propagation Analysis**:
   - Real-time incident graph rendering dynamically derived from the selected verified incident.
   - 3 Specialized DSA Graphs:
     - **Information Source Graph**: Authority domains, citations, and external cross-references.
     - **Information Propagation Graph**: Account-level dissemination and cascade speed.
     - **Claim Relationship Graph**: Supporting, contradictory, and duplicate variants.
   - **Interactive Canvas Controls**:
     - `+` / `−`: Zoom In / Zoom Out (0.4x to 2.5x).
     - `↺`: Reset Zoom and Pan.
     - `▶ / ⏸`: Animated Breadth-First Search (BFS) information cascade simulation with golden pulsing rings.
     - Drag & Pan canvas navigation with live HUD status.

3. **What-If Propagation Simulator**:
   - Synchronously linked with the active verified incident.
   - Real source name assigned to the root seed node (`U001`).
   - Dynamically calibrated virality rate ($p \approx 72\%$ for rumors, $p \approx 48\%$ for verified news).
   - BFS Intervention Simulator: evaluates reduction in total reached nodes when key influencers are removed.
   - Centrality Analysis: Degree Centrality and Betweenness Centrality.

4. **Persistence & Full Authentication**:
   - SQLite Database (`data_echo.db`) storing user credentials (securely hashed) and full verification histories.
   - State preservation across page reloads and cross-tab navigation.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Start Backend Server
```bash
cd data-echo/backend
pip install -r requirements.txt
python app.py
```
*Backend runs on `http://127.0.0.1:5000` (SQLite database initializes automatically).*

### 2. Start Frontend Dev Server
```bash
cd data-echo
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` (Vite dev server with automatic `/api` proxy).*

---

## 📦 Single-Port Production Serving (Local or On-Premise)

The Flask backend is configured to statically serve the compiled React SPA from `data-echo/dist` on a single unified port:

```bash
# 1. Build frontend
cd data-echo
npm run build

# 2. Run unified server
python backend/app.py
```
*Visit `http://localhost:5000` — both the React UI and API endpoints run seamlessly on a single port.*

---

## 🐳 Docker Deployment

Run Data Echo in a containerized production environment:

```bash
# Build and run with Docker Compose
docker compose up --build -d
```
*The app will be available on `http://localhost:5000`.*

To build and run with raw Docker:
```bash
docker build -t data-echo .
docker run -p 5000:5000 -e SECRET_KEY="your-secret-key" data-echo
```

---

## ☁️ Cloud Deployment Options

### Option 1: Render (Recommended for full-stack)
1. Fork or push this repository to GitHub.
2. In Render, create a new **Web Service** and connect your repository.
3. Configure settings (or let `render.yaml` auto-configure):
   - **Environment**: Python 3
   - **Build Command**: `cd data-echo && npm install && npm run build && pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir data-echo/backend --bind 0.0.0.0:$PORT --workers 2 --threads 4 app:app`
   - Add environment variable `SECRET_KEY`.

### Option 2: Railway
1. Create a new project from your GitHub repo.
2. Railway detects `Procfile` / `Dockerfile` automatically.
3. Set `PORT=5000` and deploy.

### Option 3: Vercel + Backend Host
- Deploy the frontend to Vercel using `vercel.json`.
- Point the backend API routes to your hosted Flask/Gunicorn backend.
