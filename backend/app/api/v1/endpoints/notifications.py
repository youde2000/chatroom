from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import notification as notification_crud
from app.schemas.notification import (
    Notification,
    NotificationBatchRead,
    NotificationBatchDelete,
    NotificationFilter
)
from app.models.user import User
from typing import List, Optional
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Notification])
def get_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    type: Optional[str] = None,
    read: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    """获取当前用户的通知列表，支持筛选和分页"""
    notifications = notification_crud.get_user_notifications(db, current_user.id)
    
    # 应用筛选条件
    if type:
        notifications = [n for n in notifications if n.type == type]
    if read is not None:
        notifications = [n for n in notifications if n.read == read]
    if start_date:
        notifications = [n for n in notifications if n.created_at >= start_date]
    if end_date:
        notifications = [n for n in notifications if n.created_at <= end_date]
    
    # 应用分页
    return notifications[skip:skip + limit]

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """获取未读通知数量"""
    count = notification_crud.get_unread_count(db, current_user.id)
    return {"count": count}

@router.post("/batch-read", response_model=List[Notification])
def mark_multiple_as_read(
    batch: NotificationBatchRead,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """批量标记通知为已读"""
    notifications = notification_crud.mark_multiple_as_read(
        db, batch.notification_ids, current_user.id
    )
    if not notifications:
        raise HTTPException(status_code=404, detail="没有找到指定的通知")
    return notifications

@router.post("/batch-delete")
def delete_multiple_notifications(
    batch: NotificationBatchDelete,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """批量删除通知"""
    count = notification_crud.delete_multiple_notifications(
        db, batch.notification_ids, current_user.id
    )
    if count == 0:
        raise HTTPException(status_code=404, detail="没有找到指定的通知")
    return {"message": f"成功删除 {count} 条通知"}

@router.get("/by-type/{type}", response_model=List[Notification])
def get_notifications_by_type(
    type: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """按类型获取通知"""
    notifications = notification_crud.get_notifications_by_type(db, current_user.id, type)
    return notifications

@router.post("/{notification_id}/read", response_model=Notification)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """标记通知为已读"""
    notification = notification_crud.mark_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    return notification

@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """标记所有通知为已读"""
    notification_crud.mark_all_as_read(db, current_user.id)
    return {"message": "所有通知已标记为已读"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """删除通知"""
    if not notification_crud.delete_notification(db, notification_id, current_user.id):
        raise HTTPException(status_code=404, detail="通知不存在")
    return {"message": "通知已删除"} 