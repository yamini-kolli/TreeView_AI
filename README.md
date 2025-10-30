TreeView AI – Full-stack App

Overview
An AI-assisted tree visualization app. Frontend: React + Vite + Redux + Bootstrap. Backend: FastAPI + PostgreSQL. Includes authentication, sessions, chat history, and Docker Compose for local deployment.

Quick start (local, without Docker)
1) Backend
   - Python 3.10
   - Create and activate venv
   - Install requirements: `pip install -r server/requirements.txt`
   - Start Postgres locally and set `DATABASE_URL` in environment or `server/app/.env`.
   - Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` from `server/`.

2) Frontend
   - Node 20+
   - `cd client`
   - `npm i`
   - Set `VITE_API_BASE=http://localhost:8000` in a `.env` file (optional; defaults to 8000).
   - `npm run dev` and open `http://localhost:5173`.

Docker Compose
1) `docker compose up --build`
2) Frontend at `http://localhost:5173`, API at `http://localhost:8000`.

Environment variables
- server/app/config.py reads: `DATABASE_URL`, `ASYNC_DATABASE_URL`, `ALLOWED_ORIGINS`, `SECRET_KEY`.
- Frontend: `VITE_API_BASE` (defaults to `http://localhost:8000`).

Backend API (important routes)
- POST `/api/auth/register` { email, username, full_name, password }
- POST `/api/auth/login` (x-www-form-urlencoded) username, password → { access_token }
- GET `/api/user/me` (Bearer)
- Trees: CRUD under `/api/tree/sessions`
- Chat: POST `/api/chat/message`, GET `/api/chat/history/{session_id}`

Frontend structure
- `client/src/store`: Redux slices for `auth`, `tree`, `chat`.
- `client/src/pages`: Login, Signup, Dashboard, TreeSession (React Flow mock).
- `client/src/utils/api.js`: Axios instance with JWT interceptor.

Testing ideas
- Backend: use pytest to test auth, tree sessions, chat history.
- Frontend: React Testing Library for Login, Dashboard, and slice reducers.

Deployment hints
- Backend: deploy container to a compute service; mount a managed Postgres.
- Frontend: serve built `dist/` with any static host or the provided Nginx image.

Screenshots
- See issue/PR attachments or generate from running app.


