import React, { useEffect, useState } from 'react';
import { Layout, Card, Button, List, Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { PlusOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ChatRoom, ChatRoomForm, User } from '../types';
import { chatRoomApi, authApi } from '../services/api';
import MainLayout from '../components/Layout';

const { Content } = Layout;

const ChatRoomList: React.FC = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [form] = Form.useForm();
    const [joinForm] = Form.useForm();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await authApi.getCurrentUser();
                setCurrentUser(userResponse);
                
                const roomsResponse = await chatRoomApi.getList();
                setChatRooms(roomsResponse);
            } catch (error) {
                message.error('获取数据失败');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleCreateRoom = async (values: ChatRoomForm) => {
        try {
            const response = await chatRoomApi.create(values);
            setChatRooms(prev => [...prev, response]);
            setCreateModalVisible(false);
            form.resetFields();
            message.success('创建聊天室成功');
        } catch (error) {
            message.error('创建聊天室失败');
        }
    };

    const handleJoinRoom = async (room: ChatRoom) => {
        setSelectedRoom(room);
        if (room.is_private) {
            setJoinModalVisible(true);
        } else {
            try {
                await chatRoomApi.join(room.id);
                navigate(`/chat/${room.id}`);
            } catch (error) {
                message.error('加入聊天室失败');
            }
        }
    };

    const handleJoinSubmit = async (values: { password: string }) => {
        if (!selectedRoom) return;

        try {
            await chatRoomApi.join(selectedRoom.id, values.password);
            setJoinModalVisible(false);
            joinForm.resetFields();
            navigate(`/chat/${selectedRoom.id}`);
        } catch (error) {
            message.error('密码错误或加入失败');
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        <MainLayout currentUser={currentUser} onLogout={() => navigate('/login')}>
            <Content style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>聊天室列表</h2>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
                        创建聊天室
                    </Button>
                </div>

                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={chatRooms}
                    loading={loading}
                    renderItem={room => (
                        <List.Item>
                            <Card
                                hoverable
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {room.name}
                                        {room.is_private && <LockOutlined />}
                                    </div>
                                }
                            >
                                <p>{room.description || '暂无描述'}</p>
                                <p>
                                    <TeamOutlined /> 成员数：{room.max_members}
                                </p>
                                <p>群主：{room.owner.username}</p>
                                <Button 
                                    type="primary" 
                                    block 
                                    onClick={() => handleJoinRoom(room)}
                                >
                                    加入聊天室
                                </Button>
                            </Card>
                        </List.Item>
                    )}
                />

                <Modal
                    title="创建聊天室"
                    open={createModalVisible}
                    onCancel={() => setCreateModalVisible(false)}
                    footer={null}
                >
                    <Form
                        form={form}
                        onFinish={handleCreateRoom}
                        layout="vertical"
                    >
                        <Form.Item
                            name="name"
                            label="聊天室名称"
                            rules={[{ required: true, message: '请输入聊天室名称' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="聊天室描述"
                        >
                            <Input.TextArea />
                        </Form.Item>

                        <Form.Item
                            name="max_members"
                            label="最大成员数"
                            rules={[{ required: true, message: '请输入最大成员数' }]}
                        >
                            <InputNumber min={2} max={100} />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="密码"
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            name="is_private"
                            label="是否私密"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                创建
                            </Button>
                            <Button style={{ marginLeft: 8 }} onClick={() => setCreateModalVisible(false)}>
                                取消
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="加入聊天室"
                    open={joinModalVisible}
                    onCancel={() => setJoinModalVisible(false)}
                    footer={null}
                >
                    <Form
                        form={joinForm}
                        onFinish={handleJoinSubmit}
                        layout="vertical"
                    >
                        <Form.Item
                            name="password"
                            label="请输入密码"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                加入
                            </Button>
                            <Button style={{ marginLeft: 8 }} onClick={() => setJoinModalVisible(false)}>
                                取消
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </MainLayout>
    );
};

export default ChatRoomList; 