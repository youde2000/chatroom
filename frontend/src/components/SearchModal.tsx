import React, { useState, useEffect } from 'react';
import { Modal, Input, Tabs, List, Avatar, Card, Space, Tag, Button, message, Select, Divider } from 'antd';
import { SearchOutlined, TeamOutlined, MessageOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import { chatRoomApi, userApi } from '../services/api';
import { ChatRoom, User, SearchHistory } from '../types';
import { useNavigate } from 'react-router-dom';
import { searchHistoryService } from '../services/searchHistory';

const { TabPane } = Tabs;
const { Option } = Select;

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
    const [activeTab, setActiveTab] = useState('chatrooms');
    const [searchText, setSearchText] = useState('');
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatRoomsTotal, setChatRoomsTotal] = useState(0);
    const [usersTotal, setUsersTotal] = useState(0);
    const [chatRoomSortBy, setChatRoomSortBy] = useState('created_at');
    const [chatRoomSortOrder, setChatRoomSortOrder] = useState<'asc' | 'desc'>('desc');
    const [userSortBy, setUserSortBy] = useState('username');
    const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (visible) {
            setSearchHistory(searchHistoryService.getHistory());
        }
    }, [visible]);

    useEffect(() => {
        if (visible && searchText) {
            handleSearch();
        }
    }, [visible, searchText, chatRoomSortBy, chatRoomSortOrder, userSortBy, userSortOrder]);

    const handleSearch = async () => {
        if (!searchText.trim()) return;

        setLoading(true);
        try {
            if (activeTab === 'chatrooms') {
                const response = await chatRoomApi.searchChatRooms(
                    searchText,
                    undefined,
                    undefined,
                    chatRoomSortBy,
                    chatRoomSortOrder
                );
                setChatRooms(response.data.items);
                setChatRoomsTotal(response.data.total);
                searchHistoryService.addHistory(searchText, 'chatroom');
            } else {
                const response = await userApi.searchUsers(
                    searchText,
                    userSortBy,
                    userSortOrder
                );
                setUsers(response.data.items);
                setUsersTotal(response.data.total);
                searchHistoryService.addHistory(searchText, 'user');
            }
            setSearchHistory(searchHistoryService.getHistory());
        } catch (error) {
            message.error('搜索失败');
        } finally {
            setLoading(false);
        }
    };

    const handleHistoryClick = (history: SearchHistory) => {
        setSearchText(history.text);
        setActiveTab(history.type === 'chatroom' ? 'chatrooms' : 'users');
    };

    const handleRemoveHistory = (id: string) => {
        searchHistoryService.removeHistoryItem(id);
        setSearchHistory(searchHistoryService.getHistory());
    };

    const handleClearHistory = () => {
        searchHistoryService.clearHistory();
        setSearchHistory([]);
    };

    const handleChatRoomClick = (roomId: number) => {
        navigate(`/chat/${roomId}`);
        onClose();
    };

    const renderChatRoomItem = (room: ChatRoom) => (
        <Card
            hoverable
            onClick={() => handleChatRoomClick(room.id)}
            style={{ marginBottom: 8 }}
        >
            <Card.Meta
                avatar={<Avatar icon={<MessageOutlined />} />}
                title={
                    <Space>
                        {room.name}
                        {room.is_private && <Tag color="red">私密</Tag>}
                    </Space>
                }
                description={
                    <Space direction="vertical" size="small">
                        <div>{room.description || '暂无描述'}</div>
                        <div>群主：{room.owner.username}</div>
                        <div>成员数：{room.member_count}</div>
                    </Space>
                }
            />
        </Card>
    );

    const renderUserItem = (user: User) => (
        <List.Item>
            <List.Item.Meta
                avatar={<Avatar>{user.username[0]}</Avatar>}
                title={user.username}
                description={user.email}
            />
        </List.Item>
    );

    const renderHistoryItem = (history: SearchHistory) => (
        <List.Item
            actions={[
                <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveHistory(history.id)}
                />
            ]}
        >
            <List.Item.Meta
                avatar={<Avatar icon={<HistoryOutlined />} />}
                title={
                    <Button
                        type="link"
                        onClick={() => handleHistoryClick(history)}
                    >
                        {history.text}
                    </Button>
                }
                description={history.type === 'chatroom' ? '聊天室' : '用户'}
            />
        </List.Item>
    );

    const renderSortOptions = () => (
        <Space style={{ marginBottom: 16 }}>
            {activeTab === 'chatrooms' ? (
                <>
                    <Select
                        value={chatRoomSortBy}
                        onChange={setChatRoomSortBy}
                        style={{ width: 120 }}
                    >
                        <Option value="created_at">创建时间</Option>
                        <Option value="name">名称</Option>
                        <Option value="member_count">成员数</Option>
                    </Select>
                    <Select
                        value={chatRoomSortOrder}
                        onChange={setChatRoomSortOrder}
                        style={{ width: 100 }}
                    >
                        <Option value="asc">升序</Option>
                        <Option value="desc">降序</Option>
                    </Select>
                </>
            ) : (
                <>
                    <Select
                        value={userSortBy}
                        onChange={setUserSortBy}
                        style={{ width: 120 }}
                    >
                        <Option value="username">用户名</Option>
                        <Option value="email">邮箱</Option>
                        <Option value="created_at">注册时间</Option>
                    </Select>
                    <Select
                        value={userSortOrder}
                        onChange={setUserSortOrder}
                        style={{ width: 100 }}
                    >
                        <Option value="asc">升序</Option>
                        <Option value="desc">降序</Option>
                    </Select>
                </>
            )}
        </Space>
    );

    return (
        <Modal
            title="搜索"
            open={visible}
            onCancel={onClose}
            width={800}
            footer={null}
        >
            <Input
                placeholder="搜索聊天室或用户..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
            />

            {renderSortOptions()}

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane 
                    tab={
                        <span>
                            <MessageOutlined />
                            聊天室 ({chatRoomsTotal})
                        </span>
                    } 
                    key="chatrooms"
                >
                    <List
                        dataSource={chatRooms}
                        renderItem={renderChatRoomItem}
                        loading={loading}
                        locale={{ emptyText: '暂无搜索结果' }}
                    />
                </TabPane>

                <TabPane 
                    tab={
                        <span>
                            <TeamOutlined />
                            用户 ({usersTotal})
                        </span>
                    } 
                    key="users"
                >
                    <List
                        dataSource={users}
                        renderItem={renderUserItem}
                        loading={loading}
                        locale={{ emptyText: '暂无搜索结果' }}
                    />
                </TabPane>
            </Tabs>

            {!searchText && (
                <>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span>搜索历史</span>
                        {searchHistory.length > 0 && (
                            <Button type="link" onClick={handleClearHistory}>
                                清空历史
                            </Button>
                        )}
                    </div>
                    <List
                        dataSource={searchHistory}
                        renderItem={renderHistoryItem}
                        locale={{ emptyText: '暂无搜索历史' }}
                    />
                </>
            )}
        </Modal>
    );
};

export default SearchModal; 