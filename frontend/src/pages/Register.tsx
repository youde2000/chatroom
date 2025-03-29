import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { RegisterForm } from '../types';

const Register: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: RegisterForm) => {
        try {
            console.log('开始注册，提交的数据:', values);
            await authApi.register(values.username, values.email, values.password);
            message.success('注册成功，请登录');
            navigate('/login');
        } catch (error: any) {
            console.error('注册失败:', error);
            if (error.response) {
                // 服务器返回了错误响应
                console.error('错误响应:', error.response.data);
                const errorMessage = error.response.data.detail || '注册失败';
                message.error(typeof errorMessage === 'string' ? errorMessage : '注册失败');
            } else if (error.request) {
                // 请求已发出但没有收到响应
                console.error('没有收到响应:', error.request);
                message.error('服务器无响应，请稍后重试');
            } else {
                // 请求配置出错
                console.error('请求配置错误:', error.message);
                message.error('请求配置错误');
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
            <Card title="注册" style={{ width: 400 }}>
                <Form
                    name="register"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少3个字符' }
                        ]}
                    >
                        <Input 
                            prefix={<UserOutlined />} 
                            placeholder="用户名" 
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                    >
                        <Input 
                            prefix={<MailOutlined />} 
                            placeholder="邮箱" 
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 6, message: '密码至少6个字符' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="密码"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: '请确认密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="确认密码"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large">
                            注册
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button type="link" onClick={() => navigate('/login')}>
                            已有账号？立即登录
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;