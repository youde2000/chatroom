from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import member as member_crud
from app.crud import notification as notification_crud
from app.crud import chat_room as chat_room_crud
from app.models.user import User
from app.models.chat_room import ChatRoom

router = APIRouter()

@router.post("/{room_id}/members/{user_id}/mute")
def mute_member(
    room_id: int,
    user_id: int,
    duration: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """禁言成员"""
    # 检查权限
    chat_room = chat_room_crud.get_chat_room(db, room_id)
    if not chat_room:
        raise HTTPException(status_code=404, detail="聊天室不存在")
    
    if not member_crud.is_admin(db, room_id, current_user.id):
        raise HTTPException(status_code=403, detail="没有权限执行此操作")

    # 执行禁言
    success = member_crud.mute_member(db, room_id, user_id, duration)
    if not success:
        raise HTTPException(status_code=400, detail="禁言失败")

    # 创建通知
    notification_crud.create_mute_notification(db, user_id, chat_room.name, duration)
    
    return {"message": "禁言成功"}

@router.post("/{room_id}/members/{user_id}/unmute")
def unmute_member(
    room_id: int,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """解除禁言"""
    # 检查权限
    chat_room = chat_room_crud.get_chat_room(db, room_id)
    if not chat_room:
        raise HTTPException(status_code=404, detail="聊天室不存在")
    
    if not member_crud.is_admin(db, room_id, current_user.id):
        raise HTTPException(status_code=403, detail="没有权限执行此操作")

    # 执行解除禁言
    success = member_crud.unmute_member(db, room_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="解除禁言失败")

    # 创建通知
    notification_crud.create_unmute_notification(db, user_id, chat_room.name)
    
    return {"message": "解除禁言成功"}

@router.post("/{room_id}/members/{user_id}/kick")
def kick_member(
    room_id: int,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """踢出成员"""
    # 检查权限
    chat_room = chat_room_crud.get_chat_room(db, room_id)
    if not chat_room:
        raise HTTPException(status_code=404, detail="聊天室不存在")
    
    if not member_crud.is_admin(db, room_id, current_user.id):
        raise HTTPException(status_code=403, detail="没有权限执行此操作")

    # 执行踢出
    success = member_crud.kick_member(db, room_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="踢出失败")

    # 创建通知
    notification_crud.create_kick_notification(db, user_id, chat_room.name)
    
    return {"message": "踢出成功"}

@router.post("/{room_id}/members/{user_id}/admin")
def set_admin(
    room_id: int,
    user_id: int,
    is_admin: bool,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """设置/取消管理员"""
    # 检查权限
    chat_room = chat_room_crud.get_chat_room(db, room_id)
    if not chat_room:
        raise HTTPException(status_code=404, detail="聊天室不存在")
    
    if chat_room.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="只有群主可以设置管理员")

    # 执行设置/取消管理员
    success = member_crud.set_admin(db, room_id, user_id, is_admin)
    if not success:
        raise HTTPException(status_code=400, detail="操作失败")

    # 创建通知
    notification_crud.create_admin_notification(db, user_id, chat_room.name, is_admin)
    
    return {"message": "操作成功"}

@router.post("/{room_id}/members/{user_id}/transfer")
def transfer_ownership(
    room_id: int,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """转让群主"""
    # 检查权限
    chat_room = chat_room_crud.get_chat_room(db, room_id)
    if not chat_room:
        raise HTTPException(status_code=404, detail="聊天室不存在")
    
    if chat_room.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="只有群主可以转让群主")

    # 执行转让
    success = member_crud.transfer_ownership(db, room_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="转让失败")

    # 创建通知
    notification_crud.create_transfer_notification(db, user_id, chat_room.name)
    
    return {"message": "转让成功"} 