from typing import List, Optional
from tortoise.queryset import QuerySet
from backend.models.chat_room import AnnouncementHistory
from backend.models.user import User

async def create_announcement_history(
    room_id: int,
    content: str,
    updated_by_id: int
) -> AnnouncementHistory:
    """创建公告历史记录"""
    return await AnnouncementHistory.create(
        room_id=room_id,
        content=content,
        updated_by_id=updated_by_id
    )

async def get_announcement_history(
    room_id: int,
    limit: int = 10,
    offset: int = 0,
    search_text: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    updated_by_id: Optional[int] = None
) -> List[AnnouncementHistory]:
    """获取公告历史记录"""
    query = AnnouncementHistory.filter(room_id=room_id)
    
    if search_text:
        query = query.filter(content__icontains=search_text)
    
    if start_date:
        query = query.filter(created_at__gte=start_date)
    
    if end_date:
        query = query.filter(created_at__lte=end_date)
    
    if updated_by_id:
        query = query.filter(updated_by_id=updated_by_id)
    
    return await query.prefetch_related('updated_by').offset(offset).limit(limit)

async def get_announcement_history_count(
    room_id: int,
    search_text: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    updated_by_id: Optional[int] = None
) -> int:
    """获取公告历史记录总数"""
    query = AnnouncementHistory.filter(room_id=room_id)
    
    if search_text:
        query = query.filter(content__icontains=search_text)
    
    if start_date:
        query = query.filter(created_at__gte=start_date)
    
    if end_date:
        query = query.filter(created_at__lte=end_date)
    
    if updated_by_id:
        query = query.filter(updated_by_id=updated_by_id)
    
    return await query.count() 