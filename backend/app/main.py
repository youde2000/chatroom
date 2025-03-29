from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1 import api_router
import uvicorn

app = FastAPI(
    title="聊天室API",
    description="一个基于FastAPI的实时聊天室系统",
    version="1.0.0"
)

# 挂载静态文件
app.mount("/static",StaticFiles(directory="static"), name="static")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix="/api/v1")

# 数据库配置
register_tortoise(
    app,
    db_url=settings.DATABASE_URL,
    modules={"models": ["app.models.user"]},  # 确保这里的路径正确
    generate_schemas=True,
    add_exception_handlers=True,
)

@app.on_event("startup")
async def startup_event():
    """
    应用启动时初始化数据库连接
    """
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    """
    应用关闭时关闭数据库连接
    """
    await close_db()

@app.get("/")
async def root():
    """
    根路由，返回API信息
    """
    return {
        "message": "欢迎使用聊天室API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",  # 修改这行，使用导入字符串
        host="0.0.0.0",
        port=8000,
        reload=True
    )