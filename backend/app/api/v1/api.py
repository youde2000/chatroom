from fastapi import APIRouter
from app.api.v1.endpoints import auth, chat_rooms, messages, members, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chat_rooms.router, prefix="/chat-rooms", tags=["chat_rooms"])
api_router.include_router(messages.router, prefix="/chat-rooms", tags=["messages"])
api_router.include_router(members.router, prefix="/chat-rooms", tags=["members"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"]) 