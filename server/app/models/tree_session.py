from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class TreeSession(Base):
    __tablename__ = "tree_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_name = Column(String, nullable=False, default="Untitled Tree")
    tree_type = Column(String, nullable=False, default="binary")
    tree_data = Column(JSON, nullable=False, default=dict)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="tree_sessions")
    chat_messages = relationship("ChatMessage", back_populates="tree_session", cascade="all, delete-orphan")
