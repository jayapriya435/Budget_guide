import os
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.database.init_db import init_db
from app.auth.routes import router as auth_router
from app.routes.home import router as home_router
from app.routes.party import router as party_router
from app.routes.jewelry import router as jewelry_router
from app.routes.history import router as history_router
from app.models.user import User
from app.models.recommendation import Recommendation
from app.dependencies import get_current_user_optional, get_current_user

# Base directory
BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ensure database tables are initialized on startup.
    """
    init_db()
    yield


# Create FastAPI app instance
app = FastAPI(
    title=settings.APP_NAME,
    description="Your Smart Budget & Recommendation Assistant for Home, Party, and Jewelry Planning.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
static_dir = BASE_DIR / "static"
static_dir.mkdir(parents=True, exist_ok=True)
uploads_dir = static_dir / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Templates engine
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Include Routers
app.include_router(auth_router)
app.include_router(home_router)
app.include_router(party_router)
app.include_router(jewelry_router)
app.include_router(history_router)


@app.get("/", response_class=HTMLResponse)
async def landing_page(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Renders the PocketSmart AI landing page.
    """
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"user": current_user}
    )


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated user dashboard showing recent recommendations and shortcuts.
    """
    recent_recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .limit(5)
        .all()
    )
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "user": current_user,
            "recent_recommendations": recent_recs
        }
    )


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring & automated checks.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
