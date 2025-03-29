from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = "postgres://postgres:123456@localhost:5432/chatroom"
    
    # JWT配置
    SECRET_KEY: str = "your-secret-key-here"  # 在生产环境中应该使用环境变量
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 跨域配置
    CORS_ORIGINS: list = ["http://localhost:3000"]  # 前端地址
    
    # 文件上传配置
    UPLOAD_DIR: str = "static/uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    class Config:
        env_file = ".env"

settings = Settings()