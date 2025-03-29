from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator

class ChatRoom(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, index=True)
    description = fields.TextField(null=True)
    password = fields.CharField(max_length=255, null=True)  # 加密存储
    max_members = fields.IntField(default=50)
    owner = fields.ForeignKeyField('models.User', related_name='owned_rooms')
    is_private = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    announcement = fields.CharField(max_length=255, null=True)  # 添加公告字段
    announcement_updated_at = fields.DatetimeField(null=True)  # 添加公告更新时间字段

    class Meta:
        table = "chat_rooms"

    def __str__(self):
        return f"{self.name}"

class AnnouncementHistory(Model):
    id = fields.IntField(pk=True)
    room = fields.ForeignKeyField('models.ChatRoom', related_name='announcement_history')
    content = fields.TextField()
    updated_by = fields.ForeignKeyField('models.User', related_name='announcement_updates')
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "announcement_history"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.room.name} - {self.content[:50]}"

# 创建Pydantic模型用于API
ChatRoom_Pydantic = pydantic_model_creator(ChatRoom, name="ChatRoom")
ChatRoomIn_Pydantic = pydantic_model_creator(ChatRoom, name="ChatRoomIn", exclude_readonly=True)
AnnouncementHistory_Pydantic = pydantic_model_creator(AnnouncementHistory, name="AnnouncementHistory") 