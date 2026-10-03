from app.database.connection import engine, Base
from app.models.user import User
from app.models.recommendation import Recommendation


def init_db():
    """
    Creates all database tables defined in SQLAlchemy models if they do not exist.
    """
    Base.metadata.create_all(bind=engine)
    print("PocketSmart AI Database tables verified and created successfully.")


if __name__ == "__main__":
    init_db()
