from enum import Enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
from tortoise.validators import RegexValidator
from app.database import Base


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    avatar = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    muted_until = Column(DateTime, nullable=True)

    notifications = relationship("Notification", back_populates="user")
    owned_rooms = relationship("ChatRoom", back_populates="owner")
    member_rooms = relationship("ChatRoomMember", back_populates="user")

    def __str__(self):
        return f"{self.username}"


# 创建 Pydantic 模型
"""
UserIn_Pydantic用于数据输入验证
用于用户注册和更新时的数据验证
只包含可以由用户提供的字段
"""
UserIn_Pydantic = pydantic_model_creator(
    User,
    name="UserIn",
    exclude_readonly=True  # 配出只读字段，如id、created_at、modified_at
)

"""
UserOut_Pydantic用于数据输出序列化
用于向前端返回用户信息时，确保敏感信息不会被泄露
"""
UserOut_Pydantic = pydantic_model_creator(
    User,
    name="UserOut",
    exclude=["password"]  # 表示在返回用户数据时，排除密码字段
)
