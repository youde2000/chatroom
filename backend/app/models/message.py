from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator
from datetime import datetime


class MessageRead(Model):
    id = fields.IntField(pk=True)
    message = fields.ForeignKeyField('models.Message', related_name='read_records')
    user = fields.ForeignKeyField('models.User', related_name='message_reads')
    read_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "message_reads"
        table_description = "消息已读记录表"

    def __str__(self):
        return f"{self.user.username} read message {self.message.id}"


class Message(Model):
    id = fields.IntField(pk=True)
    room = fields.ForeignKeyField('models.ChatRoom', related_name='messages')
    sender = fields.ForeignKeyField('models.User', related_name='sent_messages')
    content = fields.TextField()
    message_type = fields.CharField(max_length=20, default='text')  # text, image
    image_url = fields.CharField(max_length=255, null=True)  # 如果是图片消息，存储图片URL
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    recalled = fields.BooleanField(default=False)
    read_records = fields.ReverseRelation["MessageRead"]

    class Meta:
        table = "messages"
        table_description = "消息表"
        ordering = ["-created_at"]  # 按时间倒序排列

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


# 创建Pydantic模型用于API
Message_Pydantic = pydantic_model_creator(Message, name="Message")
MessageIn_Pydantic = pydantic_model_creator(Message, name="MessageIn", exclude_readonly=True)
MessageRead_Pydantic = pydantic_model_creator(MessageRead, name="MessageRead") 