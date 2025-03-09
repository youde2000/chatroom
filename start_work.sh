#!/bin/bash
set -euo pipefail

echo "===== 开始工作 ====="

# 验证 conda 是否可用
if ! command -v conda &>/dev/null; then
    echo "错误：未找到 conda，请确保 Miniconda 已正确安装并配置"
    exit 1
fi

ENV_NAME="py311"
CONDA_PREFIX=$(conda info --base)

echo "1. 拉取最新代码..."
git pull origin main || { echo "❌ 代码拉取失败"; exit 1; }

echo "2. 准备 Python 3.11 环境..."
# 初始化 conda
eval "$(conda shell.bash hook)"

# 创建环境（如果不存在）
if ! conda env list | grep -q $ENV_NAME; then
    echo "正在创建 conda 环境..."
    conda create -n $ENV_NAME python=3.11 -y
fi

# 激活环境
conda activate $ENV_NAME
echo "当前 Python 版本: $(python --version)"

echo "3. 安装后端依赖..."
cd backend || { echo "❌ 进入 backend 目录失败"; exit 1; }
pip install --upgrade pip
pip install -r requirements.txt || { echo "❌ 后端依赖安装失败"; exit 1; }
cd ..

echo "4. 安装前端依赖..."
cd frontend || { echo "❌ 进入 frontend 目录失败"; exit 1; }
npm install || { echo "❌ 前端依赖安装失败"; exit 1; }
cd ..

echo "5. 启动服务..."
# 获取 Python 绝对路径
PYTHON_PATH="$CONDA_PREFIX/envs/$ENV_NAME/bin/python"

# 启动后端服务（使用 macOS 原生终端）
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/backend && '"$PYTHON_PATH"' -m app.main"'

# 启动前端服务
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/frontend && npm start"'

echo "===== 环境已就绪 ✅ ====="