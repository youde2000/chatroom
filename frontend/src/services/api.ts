import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { User, ChatRoom, Message, ChatRoomForm, MessageForm, MuteRecord, Notification, AnnouncementHistory } from '../types';

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
    login: (username: string, password: string): Promise<{ access_token: string }> => {
        console.log('发送登录请求:', { username, password });
        return api.post('/auth/login', new URLSearchParams({
            username,
            password
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(response => {
            console.log('登录响应:', response);
            return response.data;
        }).catch(error => {
            alert("登录请求失败")
            console.error('登录请求失败:', error);
            throw error;
        });
    },
    register: (username: string, email: string, password: string): Promise<void> => {
        console.log('发送注册请求:', { username, email, password });
        return api.post('/auth/register', { username, email, password })
            .then(response => {
                console.log('注册请求成功:', response);
                return Promise.resolve();
            })
            .catch(error => {
                console.error('注册请求失败:', error);
                if (error.response) {
                    console.error('错误响应数据:', error.response.data);
                    console.error('错误状态码:', error.response.status);
                    console.error('错误头信息:', error.response.headers);
                }
                throw error;
            });
    },
    getCurrentUser: (): Promise<User> => {
        console.log('获取当前用户信息');
        return api.get('/auth/me')
            .then(response => {
                console.log('获取用户信息成功:', response);
                return response.data;
            })
            .catch(error => {
                console.error('获取用户信息失败:', error);
                throw error;
            });
    },
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
    updateAnnouncement: (roomId: number, announcement: string): Promise<void> => 
        api.put(`/chat-rooms/${roomId}/announcement`, { announcement }),
    getAnnouncement: (roomId: number): Promise<{ announcement: string; updated_at: string }> => 
        api.get(`/chat-rooms/${roomId}/announcement`),
    getAnnouncementHistory: (
        roomId: number,
        offset: number = 0,
        limit: number = 10,
        searchText?: string,
        startDate?: string,
        endDate?: string,
        updatedById?: number
    ): Promise<{ items: AnnouncementHistory[]; total: number }> => api.get(
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
    ): Promise<{ items: ChatRoom[]; total: number }> => api.get(
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
    getSuggestions: (searchText: string): Promise<ChatRoom[]> => 
        api.get('/chat-rooms/suggestions', { 
            params: { search_text: searchText } 
        }),
};

// 消息相关API
export const messageApi = {
    send: (roomId: number, data: MessageForm): Promise<Message> => 
        api.post(`/chat-rooms/${roomId}/messages`, data),
    getList: (roomId: number): Promise<Message[]> => 
        api.get(`/chat-rooms/${roomId}/messages`),
    uploadImage: (roomId: number, file: File): Promise<Message> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/chat-rooms/${roomId}/messages/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    recallMessage: (messageId: number): Promise<void> => 
        api.delete(`/messages/${messageId}`),
    markAsRead: (messageId: number): Promise<void> => 
        api.post(`/messages/${messageId}/read`),
    getReadCount: (messageId: number): Promise<number> => 
        api.get(`/messages/${messageId}/read-count`),
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
    getNotifications: (): Promise<Notification[]> => api.get('/notifications'),
    getUnreadCount: (): Promise<number> => api.get('/notifications/unread-count'),
    markAsRead: (notificationId: number): Promise<void> => api.post(`/notifications/${notificationId}/read`),
    markAllAsRead: (): Promise<void> => api.post('/notifications/mark-all-read'),
    deleteNotification: (notificationId: number): Promise<void> => api.delete(`/notifications/${notificationId}`),
    deleteMultipleNotifications: (notificationIds: number[]): Promise<void> => 
        api.post('/notifications/batch-delete', { notification_ids: notificationIds })
};

export const userApi = {
    searchUsers: (
        searchText?: string,
        offset: number = 0,
        limit: number = 10
    ): Promise<{ items: User[]; total: number }> => api.get(
        '/users/search',
        { 
            params: { 
                search_text: searchText,
                offset,
                limit
            } 
        }
    ),
    getSuggestions: (searchText: string): Promise<User[]> => 
        api.get('/users/suggestions', { 
            params: { search_text: searchText } 
        }),
};