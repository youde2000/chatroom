// 用户相关类型
export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginForm {
    username: string;
    password: string;
}

export interface RegisterForm extends LoginForm {
    email: string;
}

// 聊天室相关类型
export interface ChatRoom {
    id: number;
    name: string;
    description?: string;
    password?: string;
    max_members: number;
    owner: User;
    is_private: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChatRoomForm {
    name: string;
    description?: string;
    password?: string;
    max_members: number;
    is_private: boolean;
}

// 消息相关类型
export interface Message {
    id: number;
    room_id: number;
    sender: User;
    content: string;
    message_type: 'text' | 'image';
    image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface MessageForm {
    content: string;
    message_type: 'text' | 'image';
}

// WebSocket消息类型
export interface WSMessage {
    type: 'message' | 'system' | 'typing';
    content?: string;
    user_id?: number;
    username?: string;
    message_type?: 'text' | 'image';
    image_url?: string;
    message_id?: number;
    created_at?: string;
}

// API响应类型
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 辅助类型
export type ApiResponseData<T> = ApiResponse<T>['data'];
export type SetStateAction<T> = T | ((prevState: T) => T); 