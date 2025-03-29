from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator

class ChatRoomMember(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='room_memberships')
    room = fields.ForeignKeyField('models.ChatRoom', related_name='members')
    is_admin = fields.BooleanField(default=False)
    is_banned = fields.BooleanField(default=False)
    joined_at = fields.DatetimeField(auto_now_add=True)
    last_read_at = fields.DatetimeField(null=True)

    class Meta:
        table = "chat_room_members"
        unique_together = (("user", "room"),)  # 确保用户不能重复加入同一个聊天室

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"

# 创建Pydantic模型用于API
ChatRoomMember_Pydantic = pydantic_model_creator(ChatRoomMember, name="ChatRoomMember")
ChatRoomMemberIn_Pydantic = pydantic_model_creator(ChatRoomMember, name="ChatRoomMemberIn", exclude_readonly=True) 