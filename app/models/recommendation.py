from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    planner_type = Column(String(50), nullable=False, index=True)  # 'home', 'party', 'jewelry'
    title = Column(String(200), nullable=True)
    budget = Column(Float, nullable=False)
    input_data = Column(Text, nullable=False)    # JSON serialized input configuration
    ai_response = Column(Text, nullable=False)   # JSON serialized AI recommendations
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)

    # Relationships
    user = relationship("User", back_populates="recommendations")

    def __repr__(self):
        return f"<Recommendation id={self.id} planner={self.planner_type} budget={self.budget}>"
