from typing import List, Optional
from tortoise.queryset import QuerySet
from backend.models.chat_room import ChatRoom
from backend.models.user import User

async def get_chat_room_suggestions(
    search_text: str,
    limit: int = 5
) -> List[ChatRoom]:
    """获取聊天室搜索建议"""
    if not search_text:
        return []
        
    query = ChatRoom.all()
    query = query.filter(
        Q(name__icontains=search_text) |
        Q(description__icontains=search_text)
    )
    
    return await query.prefetch_related('owner').limit(limit)

async def search_chat_rooms(
    search_text: Optional[str] = None,
    owner_id: Optional[int] = None,
    is_private: Optional[bool] = None,
    sort_by: str = 'created_at',
    sort_order: str = 'desc',
    limit: int = 10,
    offset: int = 0
) -> List[ChatRoom]:
    """搜索聊天室"""
    query = ChatRoom.all()
    
    if search_text:
        query = query.filter(
            Q(name__icontains=search_text) |
            Q(description__icontains=search_text)
        )
    
    if owner_id:
        query = query.filter(owner_id=owner_id)
    
    if is_private is not None:
        query = query.filter(is_private=is_private)
    
    if sort_order == 'desc':
        query = query.order_by(f'-{sort_by}')
    else:
        query = query.order_by(sort_by)
    
    return await query.prefetch_related('owner').offset(offset).limit(limit)

async def search_chat_rooms_count(
    search_text: Optional[str] = None,
    owner_id: Optional[int] = None,
    is_private: Optional[bool] = None
) -> int:
    """获取搜索结果总数"""
    query = ChatRoom.all()
    
    if search_text:
        query = query.filter(
            Q(name__icontains=search_text) |
            Q(description__icontains=search_text)
        )
    
    if owner_id:
        query = query.filter(owner_id=owner_id)
    
    if is_private is not None:
        query = query.filter(is_private=is_private)
    
    return await query.count() 