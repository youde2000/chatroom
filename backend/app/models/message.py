from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship

class MessageRead(Model):
    __tablename__ = "message_reads"

    id = fields.IntField(pk=True, index=True)
    message_id = fields.IntField(ForeignKey("messages.id"))
    user_id = fields.IntField(ForeignKey("users.id"))
    read_at = fields.DatetimeField(default=datetime.utcnow)

    message = relationship("Message", back_populates="reads")
    user = relationship("User", back_populates="message_reads")

class Message(Model):
    __tablename__ = "messages"

    id = fields.IntField(pk=True, index=True)
    room = fields.ForeignKeyField('models.ChatRoom', related_name='messages')
    sender = fields.ForeignKeyField('models.User', related_name='sent_messages')
    content = fields.TextField()
    message_type = fields.CharField(max_length=20, default='text')  # text, image
    image_url = fields.CharField(max_length=255, null=True)  # 如果是图片消息，存储图片URL
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    recalled = fields.BooleanField(default=False)
    reads = fields.ManyToManyField('models.MessageRead', related_name='messages')

    class Meta:
        table = "messages"
        ordering = ["-created_at"]  # 按时间倒序排列

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

# 创建Pydantic模型用于API
Message_Pydantic = pydantic_model_creator(Message, name="Message")
MessageIn_Pydantic = pydantic_model_creator(Message, name="MessageIn", exclude_readonly=True) 