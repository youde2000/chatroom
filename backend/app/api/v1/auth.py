from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.models.user import User, UserIn_Pydantic, UserOut_Pydantic
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.crud.user import create_user, get_user_by_username, authenticate_user
from app.schemas.user import UserCreate
from app.schemas.token import Token
from datetime import timedelta

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/register", response_model=UserOut_Pydantic)
async def register(user_data: UserCreate):
    try:
        # 检查用户是否已存在
        existing_user = await get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # 创建新用户
        user = await create_user(user_data.username, user_data.password)
        return await UserOut_Pydantic.from_tortoise_orm(user)
    except Exception as e:
        print(f"Registration error: {str(e)}")  # 添加日志
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    user = await create_user(user_data.username, user_data.password)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}