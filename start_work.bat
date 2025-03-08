@echo off
echo ===== 开始工作 =====
echo 1. 拉取最新代码...
git pull origin main

echo 2. 检查环境...
cd backend
pip install -r requirements.txt
cd ../frontend
npm install

echo 3. 启动服务...
start cmd /k "cd backend && python -m app.main"
start cmd /k "cd frontend && npm start"

echo ===== 环境已就绪 =====