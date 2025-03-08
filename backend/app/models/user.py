from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

class User(models.Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    password = fields.CharField(max_length=128)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"

    def __str__(self):
        return self.username

# 创建 Pydantic 模型
UserIn_Pydantic = pydantic_model_creator(
    User, 
    name="UserIn", 
    exclude_readonly=True
)

UserOut_Pydantic = pydantic_model_creator(
    User, 
    name="UserOut", 
    exclude=["password"]
)