from typing import Optional
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