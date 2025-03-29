import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
    children, 
    requireAuth = true,
    requireAdmin = false 
}) => {
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const user = await authApi.getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (requireAuth && !currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && currentUser && !currentUser.is_admin) {
        return <Navigate to="/chat" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard; 