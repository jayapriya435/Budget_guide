import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# In production (Cloud Run), use /tmp for writable SQLite (ephemeral but functional)
# In development, use file-based SQLite as configured in .env
if settings.APP_ENV == "production" and "sqlite" in settings.DATABASE_URL:
    db_url = "sqlite:////tmp/pocketsmart.db"
else:
    db_url = settings.DATABASE_URL

# SQLite connection args for multi-threaded FastAPI access
connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=settings.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency generator for FastAPI database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
