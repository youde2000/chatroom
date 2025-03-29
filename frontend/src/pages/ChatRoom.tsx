import React, { useEffect, useState, useRef } from 'react';
import { Layout, Input, Button, List, Avatar, Card, message, Modal, Upload, Dropdown, Menu, Form, InputNumber, Switch, Table, DatePicker, Select, Space, Badge, Alert } from 'antd';
import { SendOutlined, UserOutlined, PictureOutlined, TeamOutlined, MoreOutlined, CrownOutlined, DeleteOutlined, SettingOutlined, SwapOutlined, AudioMutedOutlined, AudioOutlined, HistoryOutlined, SearchOutlined, BellOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { chatRoomApi, messageApi, memberApi, authApi, notificationApi } from '../services/api';
import { Message, ChatRoom as ChatRoomType, User, ChatRoomForm, MuteRecord, Notification, AnnouncementHistory } from '../types';
import MainLayout from '../components/Layout';
import { WebSocketService } from '../services/websocket';
import { useAuth } from '../hooks/useAuth';

const { Content, Sider } = Layout;
const { TextArea } = Input;

const ChatRoom: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [form] = Form.useForm();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const wsService = useRef<WebSocketService | null>(null);
    const [mutedUsers, setMutedUsers] = useState<Set<number>>(new Set());
    const [muteModalVisible, setMuteModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [muteForm] = Form.useForm();
    const [muteRecords, setMuteRecords] = useState<MuteRecord[]>([]);
    const [muteHistoryVisible, setMuteHistoryVisible] = useState(false);
    const [muteCheckInterval, setMuteCheckInterval] = useState<NodeJS.Timeout | null>(null);
    const [muteFilter, setMuteFilter] = useState({
        searchText: '',
        dateRange: [null, null] as [Date | null, Date | null],
        status: 'all' as 'all' | 'active' | 'expired'
    });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [announcement, setAnnouncement] = useState<string>('');
    const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
    const [announcementInput, setAnnouncementInput] = useState('');
    const [announcementHistory, setAnnouncementHistory] = useState<AnnouncementHistory[]>([]);
    const [announcementHistoryVisible, setAnnouncementHistoryVisible] = useState(false);
    const [announcementHistoryLoading, setAnnouncementHistoryLoading] = useState(false);
    const [announcementHistoryTotal, setAnnouncementHistoryTotal] = useState(0);
    const [announcementHistoryPage, setAnnouncementHistoryPage] = useState(1);
    const [announcementHistoryFilter, setAnnouncementHistoryFilter] = useState({
        searchText: '',
        dateRange: [null, null] as [Date | null, Date | null],
        updatedById: undefined as number | undefined
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomResponse = await chatRoomApi.getDetail(parseInt(roomId!));
                setChatRoom(roomResponse);
                
                const messagesResponse = await messageApi.getMessages(parseInt(roomId!), 0, 50);
                setMessages(messagesResponse);
                
                const membersResponse = await memberApi.getMembers(parseInt(roomId!));
                setMembers(membersResponse);

                const muteRecordsResponse = await memberApi.getMuteRecords(parseInt(roomId!));
                setMuteRecords(muteRecordsResponse);
                
                const notificationsResponse = await notificationApi.getNotifications();
                setNotifications(notificationsResponse);
                
                // 启动禁言检查定时器
                const interval = setInterval(() => {
                    const now = new Date();
                    const updatedMutedUsers = new Set<number>();
                    membersResponse.forEach(member => {
                        if (member.muted_until && new Date(member.muted_until) > now) {
                            updatedMutedUsers.add(member.id);
                        }
                    });
                    setMutedUsers(updatedMutedUsers);
                }, 60000); // 每分钟检查一次

                setMuteCheckInterval(interval);
            } catch (error) {
                message.error('获取数据失败');
                navigate('/chat');
            } finally {
                setLoading(false);
            }
        };

        if (roomId) {
            fetchData();
        }

        // 初始化 WebSocket 连接
        if (roomId) {
            wsService.current = new WebSocketService(parseInt(roomId));
            wsService.current.connect();
        }

        return () => {
            if (muteCheckInterval) {
                clearInterval(muteCheckInterval);
            }
            wsService.current?.disconnect();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [roomId, navigate]);

    useEffect(() => {
        if (roomId) {
            loadAnnouncement();
        }
    }, [roomId]);

    const loadAnnouncement = async () => {
        try {
            const response = await chatRoomApi.getAnnouncement(roomId);
            setAnnouncement(response.data.announcement || '');
        } catch (error) {
            message.error('加载公告失败');
        }
    };

    const loadAnnouncementHistory = async () => {
        try {
            setAnnouncementHistoryLoading(true);
            const response = await chatRoomApi.getAnnouncementHistory(
                parseInt(roomId!),
                (announcementHistoryPage - 1) * 10,
                10,
                announcementHistoryFilter.searchText,
                announcementHistoryFilter.dateRange[0]?.toISOString(),
                announcementHistoryFilter.dateRange[1]?.toISOString(),
                announcementHistoryFilter.updatedById
            );
            setAnnouncementHistory(response.data.items);
            setAnnouncementHistoryTotal(response.data.total);
        } catch (error) {
            message.error('加载公告历史失败');
        } finally {
            setAnnouncementHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (announcementHistoryVisible) {
            setAnnouncementHistoryPage(1); // 重置页码
            loadAnnouncementHistory();
        }
    }, [announcementHistoryVisible, announcementHistoryFilter]);

    useEffect(() => {
        if (announcementHistoryVisible) {
            loadAnnouncementHistory();
        }
    }, [announcementHistoryPage]);

    const handleUpdateAnnouncement = async () => {
        try {
            await chatRoomApi.updateAnnouncement(roomId, announcementInput);
            setAnnouncement(announcementInput);
            setIsEditingAnnouncement(false);
            message.success('公告更新成功');
            loadAnnouncementHistory(); // 刷新历史记录
        } catch (error) {
            message.error('更新公告失败');
        }
    };

    const handleRecallMessage = async (messageId: number) => {
        try {
            await messageApi.recallMessage(messageId);
            setMessages(messages.map(m => 
                m.id === messageId ? { ...m, content: '[消息已撤回]', recalled: true } : m
            ));
            message.success('消息已撤回');
        } catch (error) {
            message.error('撤回消息失败');
        }
    };

    const handleMarkAsRead = async (messageId: number) => {
        try {
            await messageApi.markAsRead(messageId);
            setMessages(messages.map(m => 
                m.id === messageId ? { ...m, is_read: true } : m
            ));
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // 发送输入状态
        wsService.current?.sendTyping(true);

        // 清除之前的定时器
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // 设置新的定时器，3秒后停止输入状态
        typingTimeoutRef.current = setTimeout(() => {
            wsService.current?.sendTyping(false);
        }, 3000);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !roomId) return;

        // 清除输入状态
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        wsService.current?.sendTyping(false);

        try {
            const response = await messageApi.send(parseInt(roomId), {
                content: inputValue,
                message_type: 'text'
            });
            
            wsService.current?.sendMessage(inputValue, 'text');
            setMessages(prev => [...prev, response]);
            setInputValue('');
        } catch (error) {
            message.error('发送消息失败');
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!roomId) return;

        try {
            const response = await messageApi.uploadImage(parseInt(roomId), file);
            wsService.current?.sendMessage(response.content, 'image');
            setMessages(prev => [...prev, response]);
        } catch (error) {
            message.error('上传图片失败');
        }
    };

    const handleKickMember = async (userId: number) => {
        if (!roomId) return;

        try {
            await memberApi.kickMember(parseInt(roomId), userId);
            setMembers(prev => prev.filter(member => member.id !== userId));
            message.success('踢出成员成功');
        } catch (error) {
            message.error('踢出成员失败');
        }
    };

    const handleSetAdmin = async (userId: number) => {
        if (!roomId) return;

        try {
            await memberApi.setAdmin(parseInt(roomId), userId);
            setMembers(prev => prev.map(member => 
                member.id === userId 
                    ? { ...member, is_admin: true }
                    : member
            ));
            message.success('设置管理员成功');
        } catch (error) {
            message.error('设置管理员失败');
        }
    };

    const handleTransferOwnership = async (userId: number) => {
        if (!roomId) return;

        try {
            await memberApi.transferOwnership(parseInt(roomId), userId);
            const newOwner = members.find(member => member.id === userId);
            setChatRoom(prev => prev ? { ...prev, owner: newOwner! } : null);
            message.success('转让群主成功');
        } catch (error) {
            message.error('转让群主失败');
        }
    };

    const handleDeleteRoom = async () => {
        if (!roomId) return;

        try {
            await chatRoomApi.delete(parseInt(roomId));
            message.success('删除聊天室成功');
            navigate('/chat');
        } catch (error) {
            message.error('删除聊天室失败');
        }
    };

    const handleUpdateSettings = async (values: Partial<ChatRoomForm>) => {
        if (!roomId) return;

        try {
            const response = await chatRoomApi.update(parseInt(roomId), values);
            setChatRoom(response);
            setSettingsVisible(false);
            form.resetFields();
            message.success('更新设置成功');
        } catch (error) {
            message.error('更新设置失败');
        }
    };

    const handleMuteMember = async (userId: number, duration: number) => {
        if (!roomId) return;

        try {
            await memberApi.muteMember(parseInt(roomId), userId, duration);
            setMutedUsers(prev => {
                const newSet = new Set<number>();
                prev.forEach(id => newSet.add(id));
                newSet.add(userId);
                return newSet;
            });
            setMuteModalVisible(false);
            muteForm.resetFields();
            message.success('禁言成功');
        } catch (error) {
            message.error('禁言失败');
        }
    };

    const handleUnmuteMember = async (userId: number) => {
        if (!roomId) return;

        try {
            await memberApi.unmuteMember(parseInt(roomId), userId);
            setMutedUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            message.success('解除禁言成功');
        } catch (error) {
            message.error('解除禁言失败');
        }
    };

    const isOwner = currentUser?.id === chatRoom?.owner.id;
    const isAdmin = currentUser?.is_admin || isOwner;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // 添加输入状态消息处理器
        wsService.current?.addTypingHandler((userId: number, isTyping: boolean) => {
            setTypingUsers((prev: Set<number>) => {
                const newSet = new Set(prev);
                if (isTyping) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });
    }, []);

    const muteHistoryColumns = [
        {
            title: '用户',
            dataIndex: 'user_id',
            key: 'user_id',
            render: (userId: number) => {
                const user = members.find(m => m.id === userId);
                return user ? user.username : '未知用户';
            }
        },
        {
            title: '禁言时长',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration}分钟`
        },
        {
            title: '开始时间',
            dataIndex: 'start_time',
            key: 'start_time',
            render: (time: string) => new Date(time).toLocaleString()
        },
        {
            title: '结束时间',
            dataIndex: 'end_time',
            key: 'end_time',
            render: (time: string) => new Date(time).toLocaleString()
        },
        {
            title: '原因',
            dataIndex: 'reason',
            key: 'reason'
        }
    ];

    const getFilteredMuteRecords = () => {
        return muteRecords.filter(record => {
            const matchesSearch = muteFilter.searchText === '' || 
                members.find(m => m.id === record.user_id)?.username.toLowerCase().includes(muteFilter.searchText.toLowerCase()) ||
                record.reason?.toLowerCase().includes(muteFilter.searchText.toLowerCase());

            const matchesDateRange = !muteFilter.dateRange || 
                (new Date(record.start_time) >= muteFilter.dateRange[0]! && 
                 new Date(record.end_time) <= muteFilter.dateRange[1]!);

            const matchesStatus = muteFilter.status === 'all' ||
                (muteFilter.status === 'active' && new Date(record.end_time) > new Date()) ||
                (muteFilter.status === 'expired' && new Date(record.end_time) <= new Date());

            return matchesSearch && matchesDateRange && matchesStatus;
        });
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => 
                prev.map(notification => ({ ...notification, read: true }))
            );
        } catch (error) {
            message.error('标记通知失败');
        }
    };

    const handleDeleteNotification = async (notificationId: number) => {
        try {
            await notificationApi.deleteNotification(notificationId);
            setNotifications(prev => 
                prev.filter(notification => notification.id !== notificationId)
            );
        } catch (error) {
            message.error('删除通知失败');
        }
    };

    const renderMessage = (message: Message) => {
        const isOwnMessage = message.sender_id === currentUser?.id;
        const canRecall = isOwnMessage && !message.recalled && 
            (new Date().getTime() - new Date(message.created_at).getTime()) < 120000;

        return (
            <div 
                key={message.id} 
                className={`message ${isOwnMessage ? 'own' : ''} ${message.recalled ? 'recalled' : ''}`}
                onMouseEnter={() => !message.is_read && handleMarkAsRead(message.id)}
            >
                <div className="message-header">
                    <span className="sender">{message.sender.username}</span>
                    <span className="time">{formatMessageTime(message.created_at)}</span>
                    {canRecall && (
                        <Button 
                            type="link" 
                            size="small" 
                            onClick={() => handleRecallMessage(message.id)}
                        >
                            撤回
                        </Button>
                    )}
                </div>
                <div className="message-content">
                    {message.message_type === 'image' ? (
                        <img src={message.content} alt="图片消息" />
                    ) : (
                        <p>{message.content}</p>
                    )}
                </div>
                <div className="message-footer">
                    <span className="read-count">
                        {message.read_count} 人已读
                    </span>
                </div>
            </div>
        );
    };

    const handleResetFilter = () => {
        setAnnouncementHistoryFilter({
            searchText: '',
            dateRange: [null, null],
            updatedById: undefined
        });
    };

    if (!currentUser || !chatRoom) {
        return null;
    }

    const memberMenu = (member: User) => (
        <Menu>
            {isAdmin && member.id !== currentUser.id && (
                <>
                    <Menu.Item 
                        key="kick" 
                        icon={<DeleteOutlined />}
                        onClick={() => handleKickMember(member.id)}
                    >
                        踢出聊天室
                    </Menu.Item>
                    {isOwner && !member.is_admin && (
                        <>
                            <Menu.Item 
                                key="admin" 
                                icon={<CrownOutlined />}
                                onClick={() => handleSetAdmin(member.id)}
                            >
                                设为管理员
                            </Menu.Item>
                            <Menu.Item 
                                key="transfer" 
                                icon={<SwapOutlined />}
                                onClick={() => {
                                    Modal.confirm({
                                        title: '确认转让群主',
                                        content: `确定要将群主转让给 ${member.username} 吗？`,
                                        onOk: () => handleTransferOwnership(member.id)
                                    });
                                }}
                            >
                                转让群主
                            </Menu.Item>
                        </>
                    )}
                    <Menu.Item 
                        key="mute" 
                        icon={mutedUsers.has(member.id) ? <AudioOutlined /> : <AudioMutedOutlined />}
                        onClick={() => {
                            if (mutedUsers.has(member.id)) {
                                handleUnmuteMember(member.id);
                            } else {
                                setSelectedMember(member);
                                setMuteModalVisible(true);
                            }
                        }}
                    >
                        {mutedUsers.has(member.id) ? '解除禁言' : '禁言'}
                    </Menu.Item>
                </>
            )}
        </Menu>
    );

    const announcementHistoryColumns = [
        {
            title: '公告内容',
            dataIndex: 'content',
            key: 'content',
        },
        {
            title: '更新人',
            dataIndex: ['updated_by', 'username'],
            key: 'updated_by',
        },
        {
            title: '更新时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (time: string) => new Date(time).toLocaleString(),
        },
    ];

    return (
        <MainLayout currentUser={currentUser} onLogout={() => navigate('/login')}>
            <Layout style={{ height: 'calc(100vh - 64px)' }}>
                <Content style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>{chatRoom.name}</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Badge count={notifications.filter(n => !n.read).length}>
                                <Button 
                                    icon={<BellOutlined />}
                                    onClick={() => setNotificationVisible(true)}
                                />
                            </Badge>
                            {isAdmin && (
                                <>
                                    <Button 
                                        icon={<SettingOutlined />}
                                        onClick={() => {
                                            form.setFieldsValue({
                                                name: chatRoom.name,
                                                description: chatRoom.description,
                                                max_members: chatRoom.max_members,
                                                is_private: chatRoom.is_private
                                            });
                                            setSettingsVisible(true);
                                        }}
                                    >
                                        设置
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        danger 
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            Modal.confirm({
                                                title: '确认删除',
                                                content: '确定要删除这个聊天室吗？此操作不可恢复。',
                                                onOk: handleDeleteRoom
                                            });
                                        }}
                                    >
                                        删除聊天室
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <Card title={chatRoom.name} style={{ marginBottom: '16px' }}>
                        <p>{chatRoom.description || '暂无描述'}</p>
                        <p>群主：{chatRoom.owner.username}</p>
                    </Card>

                    {announcement && (
                        <div className="announcement">
                            <Alert
                                message="群公告"
                                description={
                                    <div>
                                        <div>{announcement}</div>
                                        {isAdmin && (
                                            <div style={{ marginTop: '8px' }}>
                                                <Button 
                                                    type="link" 
                                                    onClick={() => setIsEditingAnnouncement(true)}
                                                >
                                                    编辑
                                                </Button>
                                                <Button 
                                                    type="link" 
                                                    onClick={() => setAnnouncementHistoryVisible(true)}
                                                >
                                                    历史记录
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                }
                                type="info"
                                showIcon
                            />
                        </div>
                    )}

                    <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px' }}>
                        <List
                            dataSource={messages}
                            renderItem={renderMessage}
                        />
                        {typingUsers.size > 0 && (
                            <div style={{ padding: '8px', color: '#999' }}>
                                {Array.from(typingUsers)
                                    .map(id => members.find(m => m.id === id)?.username)
                                    .filter(Boolean)
                                    .join('、')} 正在输入...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Input.TextArea
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="输入消息..."
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <Upload
                            showUploadList={false}
                            beforeUpload={(file) => {
                                handleImageUpload(file);
                                return false;
                            }}
                        >
                            <Button icon={<PictureOutlined />} />
                        </Upload>
                        <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>
                            发送
                        </Button>
                    </div>

                    <Modal
                        title="聊天室设置"
                        open={settingsVisible}
                        onCancel={() => setSettingsVisible(false)}
                        footer={null}
                    >
                        <Form
                            form={form}
                            onFinish={handleUpdateSettings}
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
                                <TextArea rows={4} />
                            </Form.Item>

                            <Form.Item
                                name="max_members"
                                label="最大成员数"
                                rules={[{ required: true, message: '请输入最大成员数' }]}
                            >
                                <InputNumber min={2} max={100} />
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
                                    保存
                                </Button>
                                <Button style={{ marginLeft: 8 }} onClick={() => setSettingsVisible(false)}>
                                    取消
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="禁言设置"
                        open={muteModalVisible}
                        onCancel={() => setMuteModalVisible(false)}
                        footer={null}
                    >
                        <Form
                            form={muteForm}
                            onFinish={(values) => selectedMember && handleMuteMember(selectedMember.id, values.duration)}
                            layout="vertical"
                        >
                            <Form.Item
                                name="duration"
                                label="禁言时长（分钟）"
                                rules={[{ required: true, message: '请输入禁言时长' }]}
                            >
                                <InputNumber min={0} max={1440} />
                                <div style={{ color: '#999', fontSize: '12px' }}>输入0表示永久禁言</div>
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    确定
                                </Button>
                                <Button style={{ marginLeft: 8 }} onClick={() => setMuteModalVisible(false)}>
                                    取消
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="禁言记录"
                        open={muteHistoryVisible}
                        onCancel={() => setMuteHistoryVisible(false)}
                        width={800}
                        footer={null}
                    >
                        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                            <Space wrap>
                                <Input
                                    placeholder="搜索用户名或原因"
                                    prefix={<SearchOutlined />}
                                    value={muteFilter.searchText}
                                    onChange={e => setMuteFilter(prev => ({ ...prev, searchText: e.target.value }))}
                                    style={{ width: 200 }}
                                />
                                <DatePicker.RangePicker
                                    onChange={(dates) => {
                                        if (dates) {
                                            setMuteFilter(prev => ({
                                                ...prev,
                                                dateRange: [dates[0]?.toDate() || null, dates[1]?.toDate() || null]
                                            }));
                                        } else {
                                            setMuteFilter(prev => ({ ...prev, dateRange: [null, null] }));
                                        }
                                    }}
                                />
                                <Select
                                    value={muteFilter.status}
                                    onChange={value => setMuteFilter(prev => ({ ...prev, status: value }))}
                                    style={{ width: 120 }}
                                >
                                    <Select.Option value="all">全部</Select.Option>
                                    <Select.Option value="active">禁言中</Select.Option>
                                    <Select.Option value="expired">已解除</Select.Option>
                                </Select>
                                <Button onClick={() => setMuteFilter({ searchText: '', dateRange: [null, null], status: 'all' })}>
                                    重置
                                </Button>
                            </Space>
                        </Space>

                        <Table
                            columns={muteHistoryColumns}
                            dataSource={getFilteredMuteRecords()}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            rowClassName={(record: MuteRecord) => {
                                const endTime = new Date(record.end_time);
                                return endTime > new Date() ? 'muted-user' : '';
                            }}
                        />
                    </Modal>

                    <Modal
                        title="通知"
                        open={notificationVisible}
                        onCancel={() => setNotificationVisible(false)}
                        width={600}
                        footer={[
                            <Button key="markAll" onClick={handleMarkAllAsRead}>
                                全部标记为已读
                            </Button>
                        ]}
                    >
                        <List
                            dataSource={notifications}
                            renderItem={(notification) => (
                                <List.Item
                                    actions={[
                                        !notification.read && (
                                            <Button type="link" onClick={() => handleMarkAsRead(notification.id)}>
                                                标记为已读
                                            </Button>
                                        ),
                                        <Button type="link" danger onClick={() => handleDeleteNotification(notification.id)}>
                                            删除
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {notification.content}
                                                {!notification.read && (
                                                    <Badge status="processing" />
                                                )}
                                            </div>
                                        }
                                        description={new Date(notification.created_at).toLocaleString()}
                                    />
                                </List.Item>
                            )}
                        />
                    </Modal>

                    <Modal
                        title="编辑群公告"
                        open={isEditingAnnouncement}
                        onOk={handleUpdateAnnouncement}
                        onCancel={() => setIsEditingAnnouncement(false)}
                    >
                        <Input.TextArea
                            value={announcementInput}
                            onChange={e => setAnnouncementInput(e.target.value)}
                            placeholder="请输入群公告"
                            rows={4}
                        />
                    </Modal>

                    <Modal
                        title="公告历史记录"
                        open={announcementHistoryVisible}
                        onCancel={() => setAnnouncementHistoryVisible(false)}
                        width={800}
                        footer={null}
                    >
                        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                            <Space wrap>
                                <Input
                                    placeholder="搜索公告内容"
                                    prefix={<SearchOutlined />}
                                    value={announcementHistoryFilter.searchText}
                                    onChange={e => setAnnouncementHistoryFilter(prev => ({ 
                                        ...prev, 
                                        searchText: e.target.value 
                                    }))}
                                    style={{ width: 200 }}
                                />
                                <DatePicker.RangePicker
                                    onChange={(dates) => {
                                        if (dates) {
                                            setAnnouncementHistoryFilter(prev => ({
                                                ...prev,
                                                dateRange: [dates[0]?.toDate() || null, dates[1]?.toDate() || null]
                                            }));
                                        } else {
                                            setAnnouncementHistoryFilter(prev => ({ 
                                                ...prev, 
                                                dateRange: [null, null] 
                                            }));
                                        }
                                    }}
                                />
                                <Select
                                    placeholder="选择更新人"
                                    allowClear
                                    style={{ width: 150 }}
                                    onChange={value => setAnnouncementHistoryFilter(prev => ({ 
                                        ...prev, 
                                        updatedById: value 
                                    }))}
                                >
                                    {members.map(member => (
                                        <Select.Option key={member.id} value={member.id}>
                                            {member.username}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button onClick={handleResetFilter}>
                                    重置
                                </Button>
                            </Space>
                        </Space>

                        <Table
                            columns={announcementHistoryColumns}
                            dataSource={announcementHistory}
                            rowKey="id"
                            loading={announcementHistoryLoading}
                            pagination={{
                                current: announcementHistoryPage,
                                pageSize: 10,
                                total: announcementHistoryTotal,
                                onChange: (page) => setAnnouncementHistoryPage(page),
                            }}
                        />
                    </Modal>
                </Content>

                <Sider width={300} style={{ background: '#fff', padding: '24px' }}>
                    <h3><TeamOutlined /> 成员列表</h3>
                    <List
                        dataSource={members}
                        renderItem={(member) => (
                            <List.Item
                                actions={[
                                    <Dropdown overlay={memberMenu(member)} trigger={['click']}>
                                        <Button type="text" icon={<MoreOutlined />} />
                                    </Dropdown>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar>{member.username[0]}</Avatar>}
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {member.username}
                                            {member.id === chatRoom.owner.id && <CrownOutlined style={{ color: '#ffd700' }} />}
                                            {member.is_admin && <UserOutlined style={{ color: '#1890ff' }} />}
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Sider>
            </Layout>
        </MainLayout>
    );
};

export default ChatRoom; 