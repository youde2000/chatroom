import React, { useState, useEffect } from 'react';
import { Modal, Input, Tabs, List, Avatar, Button, Empty, Tag } from 'antd';
import { UserOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { chatRoomApi, userApi } from '../services/api';
import { ChatRoom, User, SearchHistory } from '../types';
import { searchHistoryService } from '../services/searchHistory';

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
}

const { TabPane } = Tabs;
const { Search } = Input;

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

    useEffect(() => {
        if (visible) {
            setSearchHistory(searchHistoryService.getHistory());
        }
    }, [visible]);

    const handleSearch = async (value: string) => {
        if (!value.trim()) return;
        
        setLoading(true);
        setSearchText(value);

        try {
            // 搜索聊天室
            const roomResponse = await chatRoomApi.searchChatRooms(value);
            setChatRooms(roomResponse.items || []);

            // 搜索用户
            const userResponse = await userApi.searchUsers(value);
            setUsers(userResponse.items || []);

            // 添加到搜索历史
            searchHistoryService.addHistory(value, 'chatroom');
            setSearchHistory(searchHistoryService.getHistory());
        } catch (error) {
            console.error('搜索失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHistory = (id: string) => {
        searchHistoryService.deleteItem(id);
        setSearchHistory(searchHistoryService.getHistory());
    };

    const handleClearHistory = () => {
        searchHistoryService.clearHistory();
        setSearchHistory([]);
    };

    const handleJoinRoom = async (room: ChatRoom) => {
        try {
            await chatRoomApi.join(room.id);
            navigate(`/chat/${room.id}`);
            onClose();
        } catch (error) {
            console.error('加入聊天室失败:', error);
        }
    };

    return (
        <Modal
            title="搜索"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            <Search
                placeholder="搜索聊天室或用户"
                onSearch={handleSearch}
                loading={loading}
                enterButton
            />
            
            <Tabs defaultActiveKey="history">
                <TabPane tab="搜索历史" key="history">
                    {searchHistory.length > 0 ? (
                        <>
                            <List
                                dataSource={searchHistory}
                                renderItem={item => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                type="text"
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleDeleteHistory(item.id)}
                                            />
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <a onClick={() => handleSearch(item.text)}>
                                                    {item.text}
                                                </a>
                                            }
                                            description={new Date(item.timestamp).toLocaleString()}
                                        />
                                    </List.Item>
                                )}
                            />
                            <div style={{ textAlign: 'right', marginTop: 8 }}>
                                <Button type="link" onClick={handleClearHistory}>
                                    清空历史记录
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Empty description="暂无搜索历史" />
                    )}
                </TabPane>
                
                <TabPane tab="聊天室" key="chatrooms">
                    <List
                        dataSource={chatRooms}
                        renderItem={room => (
                            <List.Item
                                actions={[
                                    <Button
                                        type="primary"
                                        onClick={() => handleJoinRoom(room)}
                                    >
                                        加入
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={room.name}
                                    description={room.description}
                                />
                                <div>
                                    {room.is_private && <Tag color="red">私密</Tag>}
                                    <Tag color="blue">{room.member_count}人</Tag>
                                </div>
                            </List.Item>
                        )}
                    />
                </TabPane>
                
                <TabPane tab="用户" key="users">
                    <List
                        dataSource={users}
                        renderItem={user => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={user.username}
                                    description={user.email}
                                />
                            </List.Item>
                        )}
                    />
                </TabPane>
            </Tabs>
        </Modal>
    );
};

export default SearchModal; 