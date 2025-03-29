from .user import User
from .chat_room import ChatRoom
from .chat_room_member import ChatRoomMember
from .message import Message

TORTOISE_ORM = {
    "connections": {"default": "postgres://postgres:postgres@localhost:5432/chatroom"},
    "apps": {
        "models": {
            "models": [
                "app.models.user",
                "app.models.chat_room",
                "app.models.chat_room_member",
                "app.models.message",
            ],
            "default_connection": "default",
        },
    },
} 