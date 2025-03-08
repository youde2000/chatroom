@echo off
echo ===== 结束工作 =====

echo 1. 添加更改...
git add .

echo 2. 提交更改...
set /p commit_msg="请输入提交信息: "
git commit -m "%commit_msg%"

echo 3. 推送到远程仓库...
git push origin main

echo ===== 工作已完成 =====
pause