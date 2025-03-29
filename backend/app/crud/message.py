from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.message import Message

def recall_message(db: Session, message_id: int, user_id: int) -> bool:
    """撤回消息"""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        return False
    
    # 检查是否是消息发送者
    if message.sender_id != user_id:
        return False
    
    # 检查消息是否在2分钟内
    if (datetime.utcnow() - message.created_at).total_seconds() > 120:
        return False
    
    message.content = "[消息已撤回]"
    message.recalled = True
    db.commit()
    return True 