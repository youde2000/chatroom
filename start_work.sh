#!/bin/bash
set -euo pipefail

echo "===== 开始工作 ====="

# 验证 conda 是否可用
if ! command -v conda &>/dev/null; then
    echo "❌ 未找到 conda，请确保 Miniconda 已正确安装并配置"
    exit 1
fi

ENV_NAME="chatroom"
PYTHON_VERSION="3.11"

echo "1. 准备 Python $PYTHON_VERSION 环境..."
# 初始化 conda
eval "$(conda shell.bash hook)"

# 检查环境是否存在
if ! conda env list | grep -q $ENV_NAME; then
    echo "❌ 未找到 conda 环境 '$ENV_NAME'，正在创建环境..."
    conda create -n $ENV_NAME python=$PYTHON_VERSION -y || { echo "❌ 环境创建失败"; exit 1; }
fi

# 激活环境
conda activate $ENV_NAME
echo "当前 Python 版本: $(python --version)"

echo "2. 安装后端依赖..."
cd backend || { echo "❌ 进入 backend 目录失败"; exit 1; }
pip install --upgrade pip
pip install -r requirements.txt || { echo "❌ 后端依赖安装失败"; exit 1; }
cd ..

echo "3. 安装前端依赖..."
cd frontend || { echo "❌ 进入 frontend 目录失败"; exit 1; }
npm install || { echo "❌ 前端依赖安装失败"; exit 1; }
cd ..

echo "4. 启动服务..."
# 获取 Python 解释器的绝对路径
PYTHON_PATH=$(conda run -n $ENV_NAME which python)

# 启动后端服务
osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd)/backend && $PYTHON_PATH -m app.main"
end tell
EOF

# 启动前端服务
osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd)/frontend && npm start"
end tell
EOF

echo "===== 环境已就绪 ✅ ====="