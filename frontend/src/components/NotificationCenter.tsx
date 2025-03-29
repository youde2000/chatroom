import React, { useEffect, useState } from 'react';
import { Badge, List, Modal, Button, Space, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { notificationApi } from '../services/api';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [visible, setVisible] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

    useEffect(() => {
        loadNotifications();
        loadUnreadCount();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationApi.getNotifications();
            setNotifications(response.data);
        } catch (error) {
            message.error('加载通知失败');
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await notificationApi.getUnreadCount();
            setUnreadCount(response.data);
        } catch (error) {
            message.error('加载未读数量失败');
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications(notifications.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            message.error('标记已读失败');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            message.error('标记全部已读失败');
        }
    };

    const handleDelete = async (notificationId: number) => {
        try {
            await notificationApi.deleteNotification(notificationId);
            setNotifications(notifications.filter(n => n.id !== notificationId));
            if (!notifications.find(n => n.id === notificationId)?.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            message.error('删除通知失败');
        }
    };

    const handleBatchDelete = async () => {
        if (selectedNotifications.length === 0) return;
        try {
            await notificationApi.deleteMultipleNotifications(selectedNotifications);
            setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
            setSelectedNotifications([]);
            loadUnreadCount();
        } catch (error) {
            message.error('批量删除失败');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'MUTE':
                return '🔇';
            case 'UNMUTE':
                return '🔊';
            case 'KICK':
                return '👢';
            case 'ADMIN':
                return '👑';
            case 'TRANSFER':
                return '🔄';
            default:
                return '📢';
        }
    };

    return (
        <>
            <Badge count={unreadCount} size="small">
                <BellOutlined 
                    style={{ fontSize: '20px', cursor: 'pointer' }} 
                    onClick={() => setVisible(true)}
                />
            </Badge>

            <Modal
                title="通知中心"
                open={visible}
                onCancel={() => setVisible(false)}
                width={600}
                footer={[
                    <Button key="markAll" onClick={handleMarkAllAsRead}>
                        全部标记为已读
                    </Button>,
                    <Button 
                        key="delete" 
                        danger 
                        onClick={handleBatchDelete}
                        disabled={selectedNotifications.length === 0}
                    >
                        删除选中
                    </Button>
                ]}
            >
                <List
                    dataSource={notifications}
                    renderItem={notification => (
                        <List.Item
                            actions={[
                                <Button 
                                    key="read" 
                                    type="link" 
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={notification.read}
                                >
                                    标记已读
                                </Button>,
                                <Button 
                                    key="delete" 
                                    type="link" 
                                    danger 
                                    onClick={() => handleDelete(notification.id)}
                                >
                                    删除
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<span style={{ fontSize: '20px' }}>{getNotificationIcon(notification.type)}</span>}
                                title={
                                    <Space>
                                        <span>{notification.content}</span>
                                        {!notification.read && <Badge status="processing" />}
                                    </Space>
                                }
                                description={formatDistanceToNow(new Date(notification.created_at), { 
                                    addSuffix: true,
                                    locale: zhCN 
                                })}
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </>
    );
};

export default NotificationCenter; 