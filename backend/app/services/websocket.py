from fastapi import WebSocket
from typing import Dict, List
import json
from datetime import datetime

class WebSocketService:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.typing_users: Dict[int, Dict[int, datetime]] = {}  # room_id -> {user_id -> timestamp}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast_message(self, room_id: int, message: dict):
        for user_id, websocket in self.active_connections.items():
            if user_id in self.typing_users.get(room_id, {}):
                await websocket.send_json(message)

    def update_typing_status(self, room_id: int, user_id: int):
        if room_id not in self.typing_users:
            self.typing_users[room_id] = {}
        self.typing_users[room_id][user_id] = datetime.utcnow()

    def remove_typing_status(self, room_id: int, user_id: int):
        if room_id in self.typing_users and user_id in self.typing_users[room_id]:
            del self.typing_users[room_id][user_id]

    async def send_notification(self, user_id: int, notification: dict):
        """发送通知给指定用户"""
        message = {
            "type": "notification",
            "data": notification
        }
        await self.send_message(user_id, message)

    async def broadcast_notification(self, user_ids: List[int], notification: dict):
        """广播通知给多个用户"""
        message = {
            "type": "notification",
            "data": notification
        }
        for user_id in user_ids:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_json(message)

websocket_service = WebSocketService() 