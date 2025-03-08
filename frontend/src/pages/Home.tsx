import React from 'react';
import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const username = localStorage.getItem('username');
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Card style={{ width: 300 }}>
                <h2>{username}，欢迎回来！</h2>
            </Card>
        </div>
    );
};

export default Home;