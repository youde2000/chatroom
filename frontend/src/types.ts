export interface MuteRecord {
    id: number;
    user_id: number;
    room_id: number;
    duration: number;  // 0 表示永久禁言
    start_time: string;
    end_time: string;
    reason?: string;
}

export enum NotificationType {
    MUTE = 'MUTE',
    UNMUTE = 'UNMUTE',
    KICK = 'KICK',
    ADMIN = 'ADMIN',
    TRANSFER = 'TRANSFER'
}

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    content: string;
    created_at: string;
    read: boolean;
}

export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    is_admin: boolean;
    muted_until?: string;
    notifications?: Notification[];
}

export interface Message {
    id: number;
    content: string;
    sender_id: number;
    room_id: number;
    created_at: string;
    recalled: boolean;
    message_type: 'text' | 'image';
    read_count: number;
    is_read: boolean;
    sender: User;
}

export interface AnnouncementHistory {
    id: number;
    room_id: number;
    content: string;
    updated_by: User;
    created_at: string;
}

export interface ChatRoom {
    id: number;
    name: string;
    description?: string;
    password?: string;
    owner_id: number;
    member_count: number;
    is_owner: boolean;
    is_admin: boolean;
    is_private: boolean;
    owner: User;
    created_at: string;
    updated_at: string;
    announcement_history?: AnnouncementHistory[];
    max_members: number;
}

export interface SearchHistory {
    id: string;
    text: string;
    type: 'chatroom' | 'user';
    timestamp: number;
}

export interface ChatRoomMember {
    id: number;
    user_id: number;
    room_id: number;
    is_admin: boolean;
    joined_at: string;
    user: User;
}

// 表单类型定义
export interface LoginForm {
    username: string;
    password: string;
}

export interface RegisterForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ChatRoomForm {
    name: string;
    description?: string;
    password?: string;
    max_members: number;
    is_private: boolean;
}

export interface MessageForm {
    content: string;
    message_type: 'text' | 'image';
}

// API 响应类型
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

// WebSocket 消息类型
export interface WebSocketMessage {
    type: 'message' | 'typing' | 'notification' | 'system';
    data: any;
} 