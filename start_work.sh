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
CONDA_PREFIX=$(conda info --base)

echo "1. 检查本地更改..."
# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️ 检测到未提交的更改，请选择操作："
    echo "  1. 暂存更改并继续（推荐）"
    echo "  2. 丢弃更改并拉取最新代码"
    echo "  3. 退出脚本"
    read -p "请输入选项 (1/2/3): " choice

    case $choice in
        1)
            echo "✅ 正在暂存更改..."
            git add . || { echo "❌ 暂存更改失败"; exit 1; }
            git stash || { echo "❌ 暂存更改失败"; exit 1; }
            echo "✅ 未提交的更改已暂存"
            ;;
        2)
            echo "⚠️ 正在丢弃本地更改..."
            git reset --hard HEAD || { echo "❌ 丢弃更改失败"; exit 1; }
            git clean -fd || { echo "❌ 清理未跟踪文件失败"; exit 1; }
            echo "✅ 本地更改已丢弃"
            ;;
        3)
            echo "❌ 用户选择退出脚本"
            exit 0
            ;;
        *)
            echo "❌ 无效选项，退出脚本"
            exit 1
            ;;
    esac
fi

echo "2. 拉取最新代码..."
git pull origin main || { echo "❌ 代码拉取失败"; exit 1; }

echo "3. 准备 Python $PYTHON_VERSION 环境..."
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

echo "4. 安装后端依赖..."
cd backend || { echo "❌ 进入 backend 目录失败"; exit 1; }
pip install --upgrade pip
pip install -r requirements.txt || { echo "❌ 后端依赖安装失败"; exit 1; }
cd ..

echo "5. 安装前端依赖..."
cd frontend || { echo "❌ 进入 frontend 目录失败"; exit 1; }
npm install || { echo "❌ 前端依赖安装失败"; exit 1; }
cd ..

echo "6. 启动服务..."
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