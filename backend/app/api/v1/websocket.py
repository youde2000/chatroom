from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.core.deps import get_current_active_user
from app.core.websocket import manager
from app.models.user import User
from app.models.chat_room import ChatRoom
from app.models.chat_room_member import ChatRoomMember
import json

router = APIRouter()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    WebSocket连接处理
    """
    # 检查是否是聊天室成员
    room = await ChatRoom.get_or_none(id=room_id)
    if not room:
        await websocket.close(code=4004, reason="聊天室不存在")
        return
    
    member = await ChatRoomMember.get_or_none(user=current_user, room=room)
    if not member:
        await websocket.close(code=4003, reason="您不是该聊天室的成员")
        return
    
    if member.is_banned:
        await websocket.close(code=4003, reason="您已被封禁")
        return
    
    # 建立连接
    await manager.connect(websocket, current_user, room_id)
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 处理消息
            if message_data["type"] == "message":
                # 广播消息到聊天室
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "message",
                        "content": message_data["content"],
                        "user_id": current_user.id,
                        "username": current_user.username,
                        "message_type": message_data.get("message_type", "text")
                    }
                )
            elif message_data["type"] == "typing":
                # 广播正在输入状态
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "typing",
                        "user_id": current_user.id,
                        "username": current_user.username
                    }
                )
    
    except WebSocketDisconnect:
        # 处理连接断开
        await manager.disconnect(current_user, room_id)
    except Exception as e:
        # 处理其他错误
        await manager.disconnect(current_user, room_id)
        raise e 