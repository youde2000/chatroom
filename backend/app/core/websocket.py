from typing import Dict, List
from fastapi import WebSocket
from app.models import User


class ConnectionManager:
    def __init__(self):
        # 存储所有活跃连接
        self.active_connections: Dict[int, WebSocket] = {}  # user_id -> WebSocket
        # 存储用户所在的聊天室
        self.user_rooms: Dict[int, List[int]] = {}  # user_id -> [room_id]

    async def connect(self, websocket: WebSocket, user: User):
        await websocket.accept()
        self.active_connections[user.id] = websocket
        self.user_rooms[user.id] = []

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]

    def add_user_to_room(self, user_id: int, room_id: int):
        if user_id in self.user_rooms:
            if room_id not in self.user_rooms[user_id]:
                self.user_rooms[user_id].append(room_id)

    def remove_user_from_room(self, user_id: int, room_id: int):
        if user_id in self.user_rooms and room_id in self.user_rooms[user_id]:
            self.user_rooms[user_id].remove(room_id)

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast_to_room(self, message: str, room_id: int):
        # 获取房间内所有用户
        room_users = [
            user_id for user_id, rooms in self.user_rooms.items()
            if room_id in rooms
        ]
        # 向房间内所有用户发送消息
        for user_id in room_users:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_text(message)

    async def broadcast_to_all(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)


# 创建全局连接管理器实例
manager = ConnectionManager() 