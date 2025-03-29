from enum import Enum
import uuid
from datetime import datetime
from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
from tortoise.validators import RegexValidator
from pydantic import BaseModel, constr


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"


class User(models.Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    email = fields.CharField(max_length=255, unique=True)
    hashed_password = fields.CharField(max_length=255)
    avatar = fields.CharField(max_length=255, null=True)
    is_active = fields.BooleanField(default=True)
    is_admin = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    muted_until = fields.DatetimeField(null=True)

    # 关系字段
    notifications = fields.ReverseRelation["Notification"]
    owned_rooms = fields.ReverseRelation["ChatRoom"]
    member_rooms = fields.ReverseRelation["ChatRoomMember"]

    def __str__(self):
        return f"{self.username}"

    class Meta:
        table = "users"
        table_description = "用户表"


class UserIn(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: constr(max_length=255)
    password: constr(min_length=6)

    class Config:
        from_attributes = True


# 创建 Pydantic 模型
"""
UserIn_Pydantic用于数据输入验证
用于用户注册和更新时的数据验证
只包含可以由用户提供的字段
"""
UserIn_Pydantic = UserIn

"""
UserOut_Pydantic用于数据输出序列化
用于向前端返回用户信息时，确保敏感信息不会被泄露
"""
UserOut_Pydantic = pydantic_model_creator(
    User,
    name="UserOut",
    exclude=["hashed_password"]  # 表示在返回用户数据时，排除密码字段
)
