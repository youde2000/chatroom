from fastapi import APIRouter
from app.api.v1 import auth, chat_rooms, chat_room_members, messages, websocket

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chat_rooms.router, prefix="/chat-rooms", tags=["chat-rooms"])
api_router.include_router(chat_room_members.router, prefix="/chat-rooms", tags=["chat-room-members"])
api_router.include_router(messages.router, prefix="/chat-rooms", tags=["messages"])
api_router.include_router(websocket.router, tags=["websocket"]) 