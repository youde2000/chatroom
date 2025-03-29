from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class NotificationType(str, enum.Enum):
    MUTE = "mute"
    UNMUTE = "unmute"
    KICK = "kick"
    ADMIN = "admin"
    TRANSFER = "transfer"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(Enum(NotificationType))
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)

    user = relationship("User", back_populates="notifications") 