from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    type: NotificationType
    content: str

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    created_at: datetime
    read: bool

    class Config:
        from_attributes = True

class NotificationBatchRead(BaseModel):
    notification_ids: List[int]

class NotificationBatchDelete(BaseModel):
    notification_ids: List[int]

class NotificationFilter(BaseModel):
    type: Optional[NotificationType] = None
    read: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None 