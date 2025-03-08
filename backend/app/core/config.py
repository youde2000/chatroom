from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ChatRoom"
    # 修改这里，把 postgresql 改为 postgres
    DATABASE_URL: str = "postgres://postgres:123456@localhost:5432/chatroom"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "your-super-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()