#!/bin/bash
set -euo pipefail

echo "===== 结束工作 ====="

# 检查当前目录是否为 Git 仓库
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "❌ 当前目录不是 Git 仓库，请确保在项目根目录运行此脚本"
    read -p "按回车键继续..."
    exit 1
fi

# 检查是否有未提交的更改
if git diff --quiet; then
    echo "ℹ️ 没有检测到更改，无需提交"
    read -p "按回车键继续..."
    exit 0
fi

echo "1. 添加更改..."
git add .
if [[ $? -ne 0 ]]; then
    echo "❌ 添加更改失败"
    read -p "按回车键继续..."
    exit 1
fi

echo "2. 提交更改..."
read -p "请输入提交信息: " commit_msg
if [[ -z "$commit_msg" ]]; then
    echo "❌ 提交信息不能为空"
    read -p "按回车键继续..."
    exit 1
fi

git commit -m "$commit_msg"
if [[ $? -ne 0 ]]; then
    echo "❌ 提交更改失败"
    read -p "按回车键继续..."
    exit 1
fi

echo "3. 推送到远程仓库..."
git push origin main
if [[ $? -ne 0 ]]; then
    echo "❌ 推送失败"
    read -p "按回车键继续..."
    exit 1
fi

echo "===== 工作已完成 ✅ ====="
read -p "按回车键继续..."