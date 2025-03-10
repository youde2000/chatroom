from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.api.v1 import auth
import uvicorn

app = FastAPI(title=settings.PROJECT_NAME)

# 挂载静态文件
app.mount("/static",StaticFiles(directory="static"), name="static")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

# 数据库配置
register_tortoise(
    app,
    db_url=settings.DATABASE_URL,
    modules={"models": ["app.models.user"]},  # 确保这里的路径正确
    generate_schemas=True,
    add_exception_handlers=True,
)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",  # 修改这行，使用导入字符串
        host="0.0.0.0",
        port=8000,
        reload=True
    )