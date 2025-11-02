# TreeView AI

# Project Overview  
A full-stack tree-editor application with an AI assistant that helps create and edit tree nodes visually using React Flow. Supports session-based trees, user authentication, and real-time assistant-driven node operations (insert/delete/connect). Built with React on the frontend and FastApi on the backend. Docker support is included for easy deployment.

# Live link: (http://ec2-13-54-127-161.ap-southeast-2.compute.amazonaws.com:8080)
# Alternative: (http://13.54.127.161:8080/)

# Features Implemented
- ✅ User authentication (Sign-up / Login)
- ✅ Compact brand navbar: logo + title on auth pages; title + Logout on Dashboard & Session pages
- ✅ Dashboard with session list and create session flow
- ✅ Tree session editor using React Flow (nodes + edges)
- ✅ AI assistant that can add/delete/connect nodes via structured operations
- ✅ Strict binary-child rules (each node: at most one left and one right child)
- ✅ Children placed one level below parent (left/right offsets)
- ✅ Suppressed toasts for historical GET responses; toasts shown only after a user-initiated POST
- ✅ Prevent duplicate node/edge toasts when assistant operations were applied
- ✅ Empty React Flow canvas for newly created sessions
- ✅ UX improvements: "Signing in..." button state, login error message shown on failure
- ✅ Dockerized backend image and env-file support

# Tech Stack

# Frontend
- React 18
- React Router
- React Flow (visual tree editor)
- Redux / Redux Toolkit (slices: auth, chat, tree)
- Axios / fetch for APIs
- Toast library (toasts for assistant/user actions)
- Bootstrap 5.3
- Reactstrap

# Backend
- FastAPI
- Uvicorn – ASGI web server to run FastAPI applications
- JWT authentication (auth slice)
- google-genai -- AI assistant integration 
- Persistence for sessions / nodes / edges (DB service — configure in server .env)
# Database
- PostgreSQL
- SQLAlchemy

# DevOps
- Docker (image & container usage supported)
- Docker Compose
# Cloud
- AWS EC2 – Hosting your backend (FastAPI + Docker).

# Prerequisites
- Docker Desktop (for containerized run)
- Git
  
# Quick Start (local development)

1. Clone repository
```powershell
git clone (https://github.com/yamini-kolli/TreeView_AI.git)
cd TreeView_AI
```

2. Frontend (dev)
```powershell
cd client
npm install
npm run dev
# open http://localhost:5143 (or the port shown)
```

3. Backend (dev)
```powershell
cd server
# create Python virtual env (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# install dependencies
pip install -r requirements.txt

# copy or create environment file
# adjust values in server/.env (DB, JWT secret, AI keys, etc.)
copy .env.example .env   # or create server/.env manually and fill values
# start FastAPI (adjust module path if your app entry is different)
uvicorn server.main:app --reload --host 0.0.0.0 --port 8080

# API will be available at http://localhost:8080 (adjust port if changed)
```

4. With Docker (containerized)
- Using a prebuilt image (example):
```powershell
# ensure server/.env exists
docker run --env-file .\server\.env -p 8080:8080 treeview-ai:local
# if port 8080 is in use, change host port:
docker run --env-file .\server\.env -p 8081:8080 treeview-ai:local
```
- If using docker-compose (if present in repo):
```powershell
docker-compose up -d
```

Port conflict note: If `docker run` fails with "Bind for 0.0.0.0:8080 failed: port is already allocated", either stop the container/process using that port or run with a different host port (e.g., `-p 8081:8080`).

API Endpoints (typical / examples)
- Authentication
  - POST /api/auth/register — register new user
  - POST /api/auth/login — login user (returns token)
  - POST /api/auth/logout — logout
  - GET /api/auth/me — current user
- Sessions & Tree
  - GET /api/sessions — list user sessions
  - POST /api/sessions — create new session
  - GET /api/sessions/:id — session metadata
  - GET /api/sessions/:id/tree — load nodes & edges for session
  - POST /api/sessions/:id/messages — send prompt to assistant (returns assistant operations/messages)
  - POST /api/sessions/:id/nodes — (optional) create node via API
  - POST /api/sessions/:id/edges — (optional) create edge via API

Screenshots

  - Login page (loginpage.png)
    
  - Signup page
  - Dashboard
  - Tree session (React Flow)

# Development Process
The project was developed as a full-stack application. Key steps included:
- Designing session + tree data structures to support nodes and edges
- Integrating React Flow for visual editing and dynamic node/edge management
- Implementing AI assistant operation parsing so assistant responses can include structured operations (insert/delete/connect)
- Enforcing binary-child rules (left/right) client-side and providing assistant feedback when operations are not permitted
- Improving UX: suppress noisy toasts for historical GET responses, show "Signing in..." while auth is in progress, and redirect to dashboard after successful signup
- Dockerizing the backend image and providing env-file support

# Challenges Faced & Solutions
- Noisy toasts from history: Suppressed toasts for GET /history and allowed toasts only after a user-initiated POST succeeded.
- Incorrect child occupancy detection: Changed logic to rely on explicit edge metadata (edge.data.side) or node positions; removed conservative fallbacks that produced false assistant messages.
- Port conflicts when running containers: Recommend checking running containers/processes or changing host port mapping.

Backend
- Auth: register, login success, login fail (invalid credentials), token protected endpoints
- Sessions: create session (new = empty canvas), load session (returns nodes/edges), save nodes/edges
- Assistant message flow: POST prompt -> assistant returns operations -> operations applied server-side and/or client-side

Frontend
- Login page: shows validation errors, disables button and shows "Signing in..." while submitting, shows error alert "Invalid email id or password" on failure
- Signup page: redirects to dashboard after successful signup
- Dashboard: lists sessions; create session brings user to an empty React Flow canvas
- TreeSession: assistant inserts nodes with edges; left/right child placement enforced; toasts suppressed for historical GET responses and enabled for post-triggered assistant replies

Contributing
- Open issues for bugs or feature requests
- Create feature branches and PRs against main
- Keep UI and server validations in sync (especially for binary-child rules)

License
- (Add your preferred license information here)

Acknowledgements / Resources
- React Flow (https://reactflow.dev)
- Redux Toolkit
- Your AI provider / assistant integration details


