from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.deps import get_current_user
from app.models.user import User, UserIn_Pydantic, UserOut_Pydantic

router = APIRouter()

@router.post("/register", response_model=UserOut_Pydantic)
async def register(user_in: UserIn_Pydantic) -> Any:
    """
    用户注册
    """
    # 检查用户名是否已存在
    if await User.exists(username=user_in.username):
        raise HTTPException(
            status_code=400,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    if await User.exists(email=user_in.email):
        raise HTTPException(
            status_code=400,
            detail="邮箱已被注册"
        )
    
    # 创建新用户
    user = await User.create(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.hashed_password)
    )
    return user

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    用户登录
    """
    user = await User.get_or_none(username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut_Pydantic.from_orm(user)
    }

@router.get("/me", response_model=UserOut_Pydantic)
async def read_users_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取当前用户信息
    """
    return current_user