import React, { useState } from 'react';  // 添加 useState
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);  // 添加loading状态

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);  // 开始加载
        try {
            const response = await login(values.username, values.password);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('username', values.username);
            message.success('登录成功！');
            navigate('/home');
        } catch (error) {
            message.error('登录失败，请检查用户名和密码！');
        } finally {
            setLoading(false);  // 结束加载
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Card title="用户登录" style={{ width: 300 }}>
                <Form name="login" onFinish={onFinish}>
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名！' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名" disabled={loading} />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码！' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" disabled={loading} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                            登录
                        </Button>
                        <Button type="link" onClick={() => navigate('/register')} disabled={loading} style={{ width: '100%' }}>
                            还没有账号？去注册
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;