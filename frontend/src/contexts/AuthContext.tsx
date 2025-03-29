import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
    currentUser: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    register: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadCurrentUser();
        }
    }, []);

    const loadCurrentUser = async () => {
        try {
            const response = await authApi.getCurrentUser();
            setCurrentUser(response);
        } catch (error) {
            console.error('Failed to load current user:', error);
            localStorage.removeItem('token');
        }
    };

    const login = async (username: string, password: string) => {
        const response = await authApi.login(username, password);
        localStorage.setItem('token', response.access_token);
        await loadCurrentUser();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
    };

    const register = async (username: string, email: string, password: string) => {
        await authApi.register(username, email, password);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 