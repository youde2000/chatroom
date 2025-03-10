from enum import Enum
import uuid

from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
from tortoise.validators import RegexValidator


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"


class User(models.Model):
    id = fields.UUIDField(
        pk=True,
        default=uuid.uuid4,
        description="用户id",
        unique=True  # 确保数据库层面的唯一性约束
    )
    username = fields.CharField(max_length=50, unique=True)
    password = fields.CharField(max_length=128)
    email = fields.CharField(
        max_length=128,
        validators=[
            RegexValidator(
                pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                flags=0  # 显式传递 flags 参数
            )
        ]
    )
    gender = fields.CharEnumField(
        enum_type=Gender,
        default=Gender.MALE,
        description="用户性别",
        max_length=4
    )
    avatar = fields.CharField(
        max_length=128, 
        default="/static/avatars/default.png", 
        null=True, 
        blank=True,
        description="用户头像"
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"

    def __str__(self):
        return self.username


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
