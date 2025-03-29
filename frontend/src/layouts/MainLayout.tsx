import React, { useState } from 'react';
import { Layout, Header, Dropdown, Space, Avatar, Menu, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from '../components/NotificationCenter';
import SearchModal from '../components/SearchModal';

const { Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [searchModalVisible, setSearchModalVisible] = useState(false);

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                个人资料
            </Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 style={{ color: 'white', margin: 0 }}>聊天室</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <NotificationCenter />
                    <Button 
                        type="text" 
                        icon={<SearchOutlined />} 
                        onClick={() => setSearchModalVisible(true)}
                        style={{ color: 'white' }}
                    >
                        搜索
                    </Button>
                    <Dropdown overlay={userMenu}>
                        <Space style={{ color: 'white', cursor: 'pointer' }}>
                            <Avatar icon={<UserOutlined />} />
                            <span>{currentUser?.username}</span>
                        </Space>
                    </Dropdown>
                </div>
            </Header>
            <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
                {children}
            </Content>
            <SearchModal 
                visible={searchModalVisible} 
                onClose={() => setSearchModalVisible(false)} 
            />
        </Layout>
    );
};

export default MainLayout; 