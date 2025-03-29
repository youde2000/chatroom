from .user import User, UserIn_Pydantic, UserOut_Pydantic
from .chat_room import ChatRoom, ChatRoom_Pydantic, ChatRoomIn_Pydantic, AnnouncementHistory, AnnouncementHistory_Pydantic
from .chat_room_member import ChatRoomMember, ChatRoomMember_Pydantic, ChatRoomMemberIn_Pydantic
from .message import Message, Message_Pydantic, MessageIn_Pydantic, MessageRead, MessageRead_Pydantic
from .notification import Notification, Notification_Pydantic, NotificationIn_Pydantic, NotificationType

TORTOISE_ORM = {
    "connections": {"default": "postgres://postgres:123456@localhost:5432/chatroom"},
    "apps": {
        "models": {
            "models": [
                "app.models.user",
                "app.models.chat_room",
                "app.models.chat_room_member",
                "app.models.message",
                "app.models.notification",
            ],
            "default_connection": "default",
        },
    },
} 