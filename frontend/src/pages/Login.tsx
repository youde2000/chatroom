import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { LoginForm } from '../types';

const Login: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: LoginForm) => {
        try {
            console.log('开始登录流程');
            const response = await authApi.login(values.username, values.password);
            console.log('登录响应:', response);
            
            if (response.access_token) {
                console.log('保存token');
                localStorage.setItem('token', response.access_token);
                
                console.log('获取用户信息');
                const user = await authApi.getCurrentUser();
                console.log('用户信息:', user);
                
                message.success('登录成功');
                navigate('/chat');
            } else {
                message.error('登录失败：未获取到token');
            }
        } catch (error: any) {
            console.error('登录失败:', error);
            if (error.response?.data?.detail) {
                message.error(error.response.data.detail);
            } else {
                message.error('登录失败，请检查用户名和密码');
            }
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: '#f0f2f5'
        }}>
            <Card title="登录" style={{ width: 400 }}>
                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input 
                            prefix={<UserOutlined />} 
                            placeholder="用户名" 
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="密码"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large">
                            登录
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button type="link" onClick={() => navigate('/register')}>
                            还没有账号？立即注册
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;