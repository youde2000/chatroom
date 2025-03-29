from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate
from typing import List
from app.services.websocket import websocket_service
import asyncio

def create_notification(db: Session, notification: NotificationCreate) -> Notification:
    db_notification = Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # 异步发送通知
    asyncio.create_task(websocket_service.send_notification(
        notification.user_id,
        {
            "id": db_notification.id,
            "type": db_notification.type,
            "content": db_notification.content,
            "created_at": db_notification.created_at.isoformat(),
            "read": db_notification.read
        }
    ))
    
    return db_notification

def create_mute_notification(db: Session, user_id: int, room_name: str, duration: int) -> Notification:
    """创建禁言通知"""
    content = f"您在聊天室 {room_name} 中被禁言 {duration} 分钟"
    if duration == 0:
        content = f"您在聊天室 {room_name} 中被永久禁言"
    
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.MUTE,
        content=content
    )
    return create_notification(db, notification)

def create_unmute_notification(db: Session, user_id: int, room_name: str) -> Notification:
    """创建解除禁言通知"""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.UNMUTE,
        content=f"您在聊天室 {room_name} 中的禁言已解除"
    )
    return create_notification(db, notification)

def create_kick_notification(db: Session, user_id: int, room_name: str) -> Notification:
    """创建踢出通知"""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.KICK,
        content=f"您已被从聊天室 {room_name} 中踢出"
    )
    return create_notification(db, notification)

def create_admin_notification(db: Session, user_id: int, room_name: str, is_admin: bool) -> Notification:
    """创建管理员状态变更通知"""
    status = "设为" if is_admin else "取消"
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.ADMIN,
        content=f"您在聊天室 {room_name} 中已被{status}管理员"
    )
    return create_notification(db, notification)

def create_transfer_notification(db: Session, user_id: int, room_name: str) -> Notification:
    """创建群主转让通知"""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.TRANSFER,
        content=f"您已成为聊天室 {room_name} 的群主"
    )
    return create_notification(db, notification)

def get_user_notifications(db: Session, user_id: int) -> list[Notification]:
    return db.query(Notification).filter(Notification.user_id == user_id).all()

def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notification:
        notification.read = True
        db.commit()
        db.refresh(notification)
    return notification

def mark_all_as_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).update({"read": True})
    db.commit()

def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notification:
        db.delete(notification)
        db.commit()
        return True
    return False

def mark_multiple_as_read(db: Session, notification_ids: List[int], user_id: int) -> List[Notification]:
    """批量标记通知为已读"""
    notifications = db.query(Notification).filter(
        Notification.id.in_(notification_ids),
        Notification.user_id == user_id
    ).all()
    
    for notification in notifications:
        notification.read = True
    
    db.commit()
    return notifications

def delete_multiple_notifications(db: Session, notification_ids: List[int], user_id: int) -> int:
    """批量删除通知"""
    result = db.query(Notification).filter(
        Notification.id.in_(notification_ids),
        Notification.user_id == user_id
    ).delete()
    
    db.commit()
    return result

def get_unread_count(db: Session, user_id: int) -> int:
    """获取未读通知数量"""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).count()

def get_notifications_by_type(db: Session, user_id: int, type: NotificationType) -> List[Notification]:
    """按类型获取通知"""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type == type
    ).all() 