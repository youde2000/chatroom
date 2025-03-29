from typing import Optional, List
from tortoise.queryset import QuerySet
from app.models.user import User
from app.core.security import verify_password, get_password_hash

async def create_user(username: str, password: str) -> User:
    user = await User.create(
        username=username,
        password=get_password_hash(password)
    )
    return user

async def get_user_by_username(username: str) -> Optional[User]:
    return await User.get_or_none(username=username)

async def authenticate_user(username: str, password: str) -> Optional[User]:
    user = await get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user

async def get_user_suggestions(
    search_text: str,
    limit: int = 5
) -> List[User]:
    """获取用户搜索建议"""
    if not search_text:
        return []
        
    query = User.all()
    query = query.filter(
        Q(username__icontains=search_text) |
        Q(email__icontains=search_text)
    )
    
    return await query.limit(limit)

async def search_users(
    search_text: Optional[str] = None,
    sort_by: str = 'username',
    sort_order: str = 'asc',
    limit: int = 10,
    offset: int = 0
) -> List[User]:
    """搜索用户"""
    query = User.all()
    
    if search_text:
        query = query.filter(
            Q(username__icontains=search_text) |
            Q(email__icontains=search_text)
        )
    
    if sort_order == 'desc':
        query = query.order_by(f'-{sort_by}')
    else:
        query = query.order_by(sort_by)
    
    return await query.offset(offset).limit(limit)

async def search_users_count(
    search_text: Optional[str] = None
) -> int:
    """获取搜索结果总数"""
    query = User.all()
    
    if search_text:
        query = query.filter(
            Q(username__icontains=search_text) |
            Q(email__icontains=search_text)
        )
    
    return await query.count()