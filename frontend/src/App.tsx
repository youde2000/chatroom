import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatRoomList from './pages/ChatRoomList';
import ChatRoom from './pages/ChatRoom';
import AuthGuard from './components/AuthGuard';

/*
路由配置
定义了React应用的页面导航结构
 */
const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<AuthGuard requireAuth={false}><Login /></AuthGuard>} />
                <Route path="/register" element={<AuthGuard requireAuth={false}><Register /></AuthGuard>} />
                <Route path="/chat" element={<AuthGuard><ChatRoomList /></AuthGuard>} />
                <Route path="/chat/:roomId" element={<AuthGuard><ChatRoom /></AuthGuard>} />
                <Route path="/" element={<Navigate to="/chat" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
