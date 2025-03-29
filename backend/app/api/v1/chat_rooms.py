from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.chat_room import ChatRoom, ChatRoom_Pydantic, ChatRoomIn_Pydantic
from app.models.chat_room_member import ChatRoomMember
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/", response_model=ChatRoom_Pydantic)
async def create_chat_room(
    room_data: ChatRoomIn_Pydantic,
    current_user: User = Depends(get_current_active_user)
) -> ChatRoom:
    """
    创建新的聊天室
    """
    # 检查聊天室名称是否已存在
    if await ChatRoom.exists(name=room_data.name):
        raise HTTPException(
            status_code=400,
            detail="聊天室名称已存在"
        )
    
    # 创建聊天室
    room = await ChatRoom.create(
        name=room_data.name,
        description=room_data.description,
        password=get_password_hash(room_data.password) if room_data.password else None,
        max_members=room_data.max_members,
        owner=current_user,
        is_private=room_data.is_private
    )
    
    # 创建者自动成为管理员
    await ChatRoomMember.create(
        user=current_user,
        room=room,
        is_admin=True
    )
    
    return room

@router.get("/", response_model=List[ChatRoom_Pydantic])
async def list_chat_rooms(
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 10
) -> List[ChatRoom]:
    """
    获取聊天室列表
    """
    rooms = await ChatRoom.all().prefetch_related('owner').offset(skip).limit(limit)
    return rooms

@router.get("/{room_id}", response_model=ChatRoom_Pydantic)
async def get_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_active_user)
) -> ChatRoom:
    """
    获取聊天室详情
    """
    room = await ChatRoom.get_or_none(id=room_id).prefetch_related('owner')
    if not room:
        raise HTTPException(
            status_code=404,
            detail="聊天室不存在"
        )
    return room

@router.post("/{room_id}/join")
async def join_chat_room(
    room_id: int,
    password: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    加入聊天室
    """
    room = await ChatRoom.get_or_none(id=room_id)
    if not room:
        raise HTTPException(
            status_code=404,
            detail="聊天室不存在"
        )
    
    # 检查是否已经是成员
    if await ChatRoomMember.exists(user=current_user, room=room):
        raise HTTPException(
            status_code=400,
            detail="您已经是该聊天室的成员"
        )
    
    # 检查是否需要密码
    if room.password and not password:
        raise HTTPException(
            status_code=401,
            detail="该聊天室需要密码"
        )
    
    # 验证密码
    if room.password and not verify_password(password, room.password):
        raise HTTPException(
            status_code=401,
            detail="密码错误"
        )
    
    # 检查人数限制
    member_count = await ChatRoomMember.filter(room=room).count()
    if member_count >= room.max_members:
        raise HTTPException(
            status_code=400,
            detail="聊天室已满"
        )
    
    # 加入聊天室
    await ChatRoomMember.create(
        user=current_user,
        room=room,
        is_admin=False
    )
    
    return {"message": "成功加入聊天室"}

@router.post("/{room_id}/leave")
async def leave_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    退出聊天室
    """
    room = await ChatRoom.get_or_none(id=room_id)
    if not room:
        raise HTTPException(
            status_code=404,
            detail="聊天室不存在"
        )
    
    # 检查是否是成员
    member = await ChatRoomMember.get_or_none(user=current_user, room=room)
    if not member:
        raise HTTPException(
            status_code=400,
            detail="您不是该聊天室的成员"
        )
    
    # 如果是群主，不允许退出
    if room.owner_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="群主不能退出聊天室"
        )
    
    # 退出聊天室
    await member.delete()
    
    return {"message": "成功退出聊天室"}

@router.delete("/{room_id}")
async def delete_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    删除聊天室
    """
    room = await ChatRoom.get_or_none(id=room_id)
    if not room:
        raise HTTPException(
            status_code=404,
            detail="聊天室不存在"
        )
    
    # 检查是否是群主
    if room.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="只有群主可以删除聊天室"
        )
    
    # 删除聊天室
    await room.delete()
    
    return {"message": "聊天室已删除"} 