from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.chat_room import ChatRoom
from app.models.chat_room_member import ChatRoomMember
from app.models.message import Message, Message_Pydantic, MessageIn_Pydantic
from app.core.config import settings
from app.core.websocket import manager
import os
import uuid
from datetime import datetime

router = APIRouter()

async def check_room_member(
    room_id: int,
    current_user: User
) -> ChatRoomMember:
    """
    检查用户是否是聊天室成员
    """
    room = await ChatRoom.get_or_none(id=room_id)
    if not room:
        raise HTTPException(
            status_code=404,
            detail="聊天室不存在"
        )
    
    member = await ChatRoomMember.get_or_none(user=current_user, room=room)
    if not member:
        raise HTTPException(
            status_code=400,
            detail="您不是该聊天室的成员"
        )
    
    if member.is_banned:
        raise HTTPException(
            status_code=403,
            detail="您已被封禁"
        )
    
    return member

@router.post("/{room_id}/messages", response_model=Message_Pydantic)
async def send_message(
    room_id: int,
    message_data: MessageIn_Pydantic,
    current_user: User = Depends(get_current_active_user)
) -> Message:
    """
    发送消息
    """
    # 检查是否是成员
    await check_room_member(room_id, current_user)
    
    # 创建消息
    message = await Message.create(
        room_id=room_id,
        sender=current_user,
        content=message_data.content,
        message_type=message_data.message_type
    )
    
    # 通过WebSocket推送消息
    await manager.broadcast_to_room(
        room_id,
        {
            "type": "message",
            "content": message_data.content,
            "user_id": current_user.id,
            "username": current_user.username,
            "message_type": message_data.message_type,
            "message_id": message.id,
            "created_at": message.created_at.isoformat()
        }
    )
    
    return message

@router.get("/{room_id}/messages", response_model=List[Message_Pydantic])
async def get_messages(
    room_id: int,
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 50
) -> List[Message]:
    """
    获取聊天室消息历史
    """
    # 检查是否是成员
    await check_room_member(room_id, current_user)
    
    # 获取消息
    messages = await Message.filter(
        room_id=room_id
    ).prefetch_related('sender').order_by('-created_at').offset(skip).limit(limit)
    
    return messages

@router.post("/{room_id}/messages/upload")
async def upload_image(
    room_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    上传图片
    """
    # 检查是否是成员
    await check_room_member(room_id, current_user)
    
    # 检查文件类型
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="只能上传图片文件"
        )
    
    # 生成文件名
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    
    # 确保上传目录存在
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(room_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # 保存文件
    file_path = os.path.join(upload_dir, file_name)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail="文件大小超过限制"
            )
        buffer.write(content)
    
    # 创建图片消息
    image_url = f"/static/uploads/{room_id}/{file_name}"
    message = await Message.create(
        room_id=room_id,
        sender=current_user,
        content="[图片消息]",
        message_type="image",
        image_url=image_url
    )
    
    # 通过WebSocket推送图片消息
    await manager.broadcast_to_room(
        room_id,
        {
            "type": "message",
            "content": "[图片消息]",
            "user_id": current_user.id,
            "username": current_user.username,
            "message_type": "image",
            "image_url": image_url,
            "message_id": message.id,
            "created_at": message.created_at.isoformat()
        }
    )
    
    return {
        "message": "图片上传成功",
        "image_url": image_url,
        "message_id": message.id
    }

@router.get("/static/uploads/{room_id}/{filename}")
async def get_image(
    room_id: int,
    filename: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    获取图片
    """
    # 检查是否是成员
    await check_room_member(room_id, current_user)
    
    # 构建文件路径
    file_path = os.path.join(settings.UPLOAD_DIR, str(room_id), filename)
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="图片不存在"
        )
    
    return FileResponse(file_path) 