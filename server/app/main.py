from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from app.config import settings
from app.database import Base, engine
from app.api import auth
from app.api import user
from app.api import tree
from app.api import chat


# app/main.py example before create_all()
from app.models import User, TreeSession, ChatMessage
# Or simply: import app.models


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Tree Data Structure Visualization & Interactive Chat",
    version="1.0.0",
    debug=settings.DEBUG
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
import os
from starlette.responses import PlainTextResponse

# # uploads directory (persistent only for container instance; for sample projects this is fine)
# UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
# os.makedirs(UPLOADS_DIR, exist_ok=True)
# app.mount('/uploads', StaticFiles(directory=UPLOADS_DIR), name='uploads')

# Register API routers (keep these available regardless of DEPLOY_ENV)
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(tree.router, prefix="/api/tree", tags=["Tree"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# frontend build directory (Vite -> client/dist)
# main.py is at server/app/main.py; client is at repo root, so path is ../../client/dist
candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'client', 'dist'))
FRONTEND_BUILD_DIR = candidate if os.path.isdir(candidate) else None

# Serve SPA if a built frontend exists in client/dist — useful for local image builds.
if FRONTEND_BUILD_DIR:
    @app.get('/{full_path:path}', include_in_schema=False)
    async def spa_fallback(full_path: str):
        requested_path = full_path or ''
        candidate_path = os.path.join(FRONTEND_BUILD_DIR, requested_path)
        if os.path.isfile(candidate_path):
            return FileResponse(candidate_path)
        index_path = os.path.join(FRONTEND_BUILD_DIR, 'index.html')
        return FileResponse(index_path)
else:
    @app.get('/')
    async def root():
        return PlainTextResponse('API is running...')

# Register debug router in development if available
try:
    from app.api import debug as debug_router
    app.include_router(debug_router.router, prefix='/api/debug', tags=['Debug'])
except Exception:
    pass


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
