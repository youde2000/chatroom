import axios from 'axios';
import { User, LoginResponse } from '../types/user';  // 添加这行导入语句

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
});

export const login = async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post<LoginResponse>('/auth/login', formData);
    return response.data;
};

export const register = async (username: string, password: string) => {
    try {
        const response = await api.post<User>('/auth/register', {
            username,
            password,
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.detail || '注册失败');
        }
        throw error;
    }
};