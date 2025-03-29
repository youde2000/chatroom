import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { User, ChatRoom, Message, LoginForm, RegisterForm, ChatRoomForm, MessageForm, MuteRecord, Notification, AnnouncementHistory } from '../types';

/*
axios是一个网络请求库，类似于Ajax，用于处理HTTP请求
主要作用是在浏览器中发送XMLHttpRequest请求、拦截请求和响应、转换请求和响应的数据等；
使用axios.create创建一个axios实例
通过这个实例，可以使用axios的api，包括request、get、post、put、delete、head等；
axios会对请求响应进行封装
{
  // 请求响应的返回值
  data: {},
  // 请求状态
  status: 200,
  // 状态说明文字
  statusText: 'OK',
  // 请求的请求头
  headers: {},
  // 这次请求用到的 配置  指 刚刚问题一的配置
  config: {},
  // 请求实例  表示 axios 底层 封装的 XMLHttpRequest 的信息
  request: {}
}
 */
const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    timeout: 5000,
});

// 请求拦截器
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response.data;
    },
    (error: any) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 认证相关API
export const authApi = {
    login: (username: string, password: string) => 
        api.post<{ access_token: string }>('/auth/login', { username, password }),
    register: (username: string, email: string, password: string) => 
        api.post('/auth/register', { username, email, password }),
    getCurrentUser: () => api.get<User>('/auth/me'),
};

// 聊天室相关API
export const chatRoomApi = {
    create: (data: ChatRoomForm): Promise<ChatRoom> => api.post('/chat-rooms', data),
    getList: (): Promise<ChatRoom[]> => api.get('/chat-rooms'),
    getDetail: (id: number): Promise<ChatRoom> => api.get(`/chat-rooms/${id}`),
    update: (id: number, data: Partial<ChatRoomForm>): Promise<ChatRoom> => api.put(`/chat-rooms/${id}`, data),
    join: (id: number, password?: string): Promise<ChatRoom> => api.post(`/chat-rooms/${id}/join`, { password }),
    leave: (id: number): Promise<void> => api.post(`/chat-rooms/${id}/leave`),
    delete: (id: number): Promise<void> => api.delete(`/chat-rooms/${id}`),
    updateAnnouncement: (roomId: number, announcement: string) => 
        api.put(`/chat-rooms/${roomId}/announcement`, { announcement }),
    getAnnouncement: (roomId: number) => 
        api.get<{ announcement: string; updated_at: string }>(`/chat-rooms/${roomId}/announcement`),
    getAnnouncementHistory: (
        roomId: number,
        offset: number = 0,
        limit: number = 10,
        searchText?: string,
        startDate?: string,
        endDate?: string,
        updatedById?: number
    ) => api.get<{ items: AnnouncementHistory[]; total: number }>(
        `/chat-rooms/${roomId}/announcement/history`,
        { 
            params: { 
                offset, 
                limit,
                search_text: searchText,
                start_date: startDate,
                end_date: endDate,
                updated_by_id: updatedById
            } 
        }
    ),
    searchChatRooms: (
        searchText?: string,
        ownerId?: number,
        isPrivate?: boolean,
        sortBy: string = 'created_at',
        sortOrder: 'asc' | 'desc' = 'desc',
        offset: number = 0,
        limit: number = 10
    ) => api.get<{ items: ChatRoom[]; total: number }>(
        '/chat-rooms/search',
        { 
            params: { 
                search_text: searchText,
                owner_id: ownerId,
                is_private: isPrivate,
                sort_by: sortBy,
                sort_order: sortOrder,
                offset,
                limit
            } 
        }
    ),
    getSuggestions: (searchText: string) => 
        api.get<ChatRoom[]>('/chat-rooms/suggestions', { 
            params: { search_text: searchText } 
        }),
};

// 消息相关API
export const messageApi = {
    send: (roomId: number, data: MessageForm): Promise<Message> => api.post(`/chat-rooms/${roomId}/messages`, data),
    getMessages: (roomId: number, offset: number, limit: number): Promise<Message[]> => 
        api.get(`/chat-rooms/${roomId}/messages`, { params: { offset, limit } }),
    uploadImage: (roomId: number, file: File): Promise<Message> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/chat-rooms/${roomId}/messages/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    recallMessage: (messageId: number) => api.post(`/messages/${messageId}/recall`),
    markAsRead: (messageId: number) => api.post(`/messages/${messageId}/read`),
    getReadCount: (messageId: number) => api.get<number>(`/messages/${messageId}/read-count`),
};

// 成员管理相关API
export const memberApi = {
    getMembers: (roomId: number): Promise<User[]> => api.get(`/chat-rooms/${roomId}/members`),
    kickMember: (roomId: number, userId: number): Promise<void> => 
        api.post(`/chat-rooms/${roomId}/members/${userId}/kick`),
    setAdmin: (roomId: number, userId: number): Promise<void> => 
        api.post(`/chat-rooms/${roomId}/members/${userId}/admin`),
    banMember: (roomId: number, userId: number): Promise<void> => 
        api.post(`/chat-rooms/${roomId}/members/${userId}/ban`),
    transferOwnership: (roomId: number, userId: number): Promise<void> => 
        api.post(`/chat-rooms/${roomId}/members/${userId}/transfer`),
    muteMember: (roomId: number, userId: number, duration: number, reason?: string): Promise<void> => 
        api.post(`/chat-rooms/${roomId}/members/${userId}/mute`, { duration, reason }),
    unmuteMember: (roomId: number, userId: number): Promise<void> => 
        api.post(`/chat-rooms/${roomId}/members/${userId}/unmute`),
    getMuteRecords: (roomId: number): Promise<MuteRecord[]> => 
        api.get(`/chat-rooms/${roomId}/mute-records`),
};

// 通知相关API
export const notificationApi = {
    getNotifications: () => api.get<Notification[]>('/notifications'),
    getUnreadCount: () => api.get<number>('/notifications/unread-count'),
    markAsRead: (notificationId: number) => api.post(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.post('/notifications/mark-all-read'),
    deleteNotification: (notificationId: number) => api.delete(`/notifications/${notificationId}`),
    deleteMultipleNotifications: (notificationIds: number[]) => api.post('/notifications/batch-delete', { notification_ids: notificationIds })
};

export const userApi = {
    searchUsers: (
        searchText?: string,
        offset: number = 0,
        limit: number = 10
    ) => api.get<{ items: User[]; total: number }>(
        '/users/search',
        { 
            params: { 
                search_text: searchText,
                offset,
                limit
            } 
        }
    ),
    getSuggestions: (searchText: string) => 
        api.get<User[]>('/users/suggestions', { 
            params: { search_text: searchText } 
        }),
};