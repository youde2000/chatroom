import axios from 'axios';
import {User, LoginResponse} from '../types/user';
import {types} from "node:util";  // 添加这行导入语句

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
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
});

export const login = async (username: string, password: string) => {
    // FormData是一个可以存储键值对的表单数据对象
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post<LoginResponse>('/auth/login', formData);
    return response.data;
};

export const register = async (username: string, password: string) => {
    try {
        const response = await api.post<User>(
            '/auth/register', {
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