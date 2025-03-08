#!/bin/bash
echo "===== 结束工作 ====="

echo "1. 添加更改..."
git add .

echo "2. 提交更改..."
read -p "请输入提交信息: " commit_msg
git commit -m "$commit_msg"

echo "3. 推送到远程仓库..."
git push origin main

echo "===== 工作已完成 ====="
read -p "按回车键继续..."