from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.chat_room import ChatRoom
from app.models.chat_room_member import ChatRoomMember, ChatRoomMember_Pydantic
from app.models.user import UserOut_Pydantic

router = APIRouter()

async def check_admin_permission(
    room_id: int,
    current_user: User
) -> ChatRoomMember:
    """
    检查用户是否有管理员权限
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
    
    if not member.is_admin and room.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="您没有管理员权限"
        )
    
    return member

@router.get("/{room_id}/members", response_model=List[UserOut_Pydantic])
async def list_room_members(
    room_id: int,
    current_user: User = Depends(get_current_active_user)
) -> List[User]:
    """
    获取聊天室成员列表
    """
    room = await ChatRoom.get_or_none(id=room_id)
    if not room:
        raise HTTPException(
            status_code=404,
            detail="聊天室不存在"
        )
    
    # 检查是否是成员
    if not await ChatRoomMember.exists(user=current_user, room=room):
        raise HTTPException(
            status_code=400,
            detail="您不是该聊天室的成员"
        )
    
    # 获取所有成员
    members = await ChatRoomMember.filter(room=room).prefetch_related('user')
    return [member.user for member in members]

@router.post("/{room_id}/members/{user_id}/kick")
async def kick_member(
    room_id: int,
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    踢出聊天室成员
    """
    # 检查管理员权限
    await check_admin_permission(room_id, current_user)
    
    # 获取要踢出的成员
    target_member = await ChatRoomMember.get_or_none(
        room_id=room_id,
        user_id=user_id
    )
    if not target_member:
        raise HTTPException(
            status_code=404,
            detail="成员不存在"
        )
    
    # 不能踢出群主
    if target_member.room.owner_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="不能踢出群主"
        )
    
    # 踢出成员
    await target_member.delete()
    
    return {"message": "成员已被踢出"}

@router.post("/{room_id}/members/{user_id}/admin")
async def set_admin(
    room_id: int,
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    设置/取消管理员权限
    """
    # 检查是否是群主
    room = await ChatRoom.get_or_none(id=room_id)
    if not room or room.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="只有群主可以设置管理员"
        )
    
    # 获取目标成员
    target_member = await ChatRoomMember.get_or_none(
        room_id=room_id,
        user_id=user_id
    )
    if not target_member:
        raise HTTPException(
            status_code=404,
            detail="成员不存在"
        )
    
    # 切换管理员状态
    target_member.is_admin = not target_member.is_admin
    await target_member.save()
    
    return {
        "message": "管理员权限已更新",
        "is_admin": target_member.is_admin
    }

@router.post("/{room_id}/members/{user_id}/ban")
async def ban_member(
    room_id: int,
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    封禁/解封聊天室成员
    """
    # 检查管理员权限
    await check_admin_permission(room_id, current_user)
    
    # 获取目标成员
    target_member = await ChatRoomMember.get_or_none(
        room_id=room_id,
        user_id=user_id
    )
    if not target_member:
        raise HTTPException(
            status_code=404,
            detail="成员不存在"
        )
    
    # 不能封禁群主
    if target_member.room.owner_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="不能封禁群主"
        )
    
    # 切换封禁状态
    target_member.is_banned = not target_member.is_banned
    await target_member.save()
    
    return {
        "message": "封禁状态已更新",
        "is_banned": target_member.is_banned
    } 