import { useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    const isAuthenticated = !!currentUser;
    const isAdmin = currentUser?.is_admin || false;

    return {
        currentUser,
        loading,
        isAuthenticated,
        isAdmin
    };
}; 