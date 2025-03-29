import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
    currentUser: User;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentUser, onLogout }) => {
    const navigate = useNavigate();

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />}>
                个人信息
            </Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout>
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white', fontSize: '18px' }}>聊天室</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/chat/create')}>
                        创建聊天室
                    </Button>
                    <Dropdown overlay={userMenu} placement="bottomRight">
                        <Button type="text" style={{ color: 'white' }}>
                            <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                            {currentUser.username}
                        </Button>
                    </Dropdown>
                </div>
            </Header>
            <Layout>
                <Sider width={200} style={{ background: '#fff' }}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['chat']}
                        style={{ height: '100%', borderRight: 0 }}
                        onClick={({ key }) => navigate(key)}
                    >
                        <Menu.Item key="/chat">聊天室列表</Menu.Item>
                    </Menu>
                </Sider>
                <Content style={{ padding: '24px', minHeight: 280, background: '#fff' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout; 