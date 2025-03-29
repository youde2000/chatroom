import React, { useEffect, useState } from 'react';
import { List, Card, Button, Input, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ChatRoom, ChatRoomForm } from '../types';
import { chatRoomApi } from '../services/api';

const Chat: React.FC = () => {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        fetchChatRooms();
    }, []);

    const fetchChatRooms = async () => {
        try {
            const rooms = await chatRoomApi.getList();
            setChatRooms(rooms);
        } catch (error) {
            message.error('获取聊天室列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (values: ChatRoomForm) => {
        try {
            const newRoom = await chatRoomApi.create(values);
            setChatRooms([...chatRooms, newRoom]);
            setIsModalVisible(false);
            form.resetFields();
            message.success('创建聊天室成功');
        } catch (error) {
            message.error('创建聊天室失败');
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Input
                    placeholder="搜索聊天室"
                    prefix={<SearchOutlined />}
                    style={{ width: 200 }}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                >
                    创建聊天室
                </Button>
            </div>

            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                dataSource={chatRooms}
                loading={loading}
                renderItem={(room) => (
                    <List.Item>
                        <Card
                            hoverable
                            title={room.name}
                            onClick={() => navigate(`/chat/${room.id}`)}
                        >
                            <p>{room.description}</p>
                            <p>成员数: {room.member_count}</p>
                            <p>创建者: {room.owner.username}</p>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                title="创建聊天室"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
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
                        label="描述"
                    >
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item
                        name="is_private"
                        label="是否私密"
                        valuePropName="checked"
                    >
                        <Input type="checkbox" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            创建
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Chat; 