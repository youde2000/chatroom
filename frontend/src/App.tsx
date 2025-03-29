import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import './App.css';

/*
路由配置
定义了React应用的页面导航结构
 */

// 路由守卫组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <ConfigProvider locale={zhCN}>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/chat"
                        element={
                            <PrivateRoute>
                                <Chat />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/chat/:roomId"
                        element={
                            <PrivateRoute>
                                <ChatRoom />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/chat" replace />} />
                </Routes>
            </Router>
        </ConfigProvider>
    );
};

export default App;
