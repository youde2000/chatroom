from datetime import datetime
from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator
import enum


class NotificationType(str, enum.Enum):
    MUTE = "mute"
    UNMUTE = "unmute"
    KICK = "kick"
    ADMIN = "admin"
    TRANSFER = "transfer"


class Notification(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='notifications')
    type = fields.CharEnumField(NotificationType)
    content = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    read = fields.BooleanField(default=False)

    class Meta:
        table = "notifications"
        table_description = "通知表"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.type.value}: {self.content}"


# 创建Pydantic模型用于API
Notification_Pydantic = pydantic_model_creator(Notification, name="Notification")
NotificationIn_Pydantic = pydantic_model_creator(Notification, name="NotificationIn", exclude_readonly=True) 