import React from 'react';
import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    // 从浏览器的localStorage中读取username对应的值
    const username = localStorage.getItem('username');
    // 钩子函数，用于在React组件中实现编程式导航
    const navigate = useNavigate();

    // useEffect钩子函数，用于在组件渲染之后执行副作用操作，第二个参数[navigate]是一个依赖数组，表示只有当navigate函数发生变化时，才执行这个useEffect函数
    React.useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    // 如果存在token，那就渲染主界面
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Card style={{ width: 300 }}>
                <h2>{username}，欢迎回来！</h2>
            </Card>
        </div>
    );
};

export default Home;