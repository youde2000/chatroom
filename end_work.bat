@echo off
setlocal enabledelayedexpansion

echo ===== 结束工作 =====

REM 检查当前目录是否为 Git 仓库
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 当前目录不是 Git 仓库，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 检查是否有未提交的更改
git diff --quiet
if %errorlevel% equ 0 (
    git diff --cached --quiet
    if %errorlevel% equ 0 (
        echo ℹ️ 没有检测到更改，无需提交
        pause
        exit /b 0
    )
)

echo 1. 添加更改...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加更改失败
    pause
    exit /b 1
)

echo 2. 提交更改...
set /p commit_msg="请输入提交信息: "
if "!commit_msg!"=="" (
    echo ❌ 提交信息不能为空
    pause
    exit /b 1
)

git commit -m "!commit_msg!"
if %errorlevel% neq 0 (
    echo ❌ 提交更改失败
    pause
    exit /b 1
)

echo 3. 推送到远程仓库...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ 推送失败，正在回滚提交并将更改放回工作区...
    git reset --mixed HEAD~1
    echo ℹ️ 已回滚提交，更改已放回工作区。请修复以下问题后重新运行脚本：
    echo    - 如果您使用 HTTPS，请确保已配置 Personal Access Token (PAT)。
    echo    - 如果您使用 SSH，请确保已配置 SSH 密钥并更新远程仓库 URL。
    echo    参考文档：https://docs.github.com/get-started/getting-started-with-git/about-remote-repositories#cloning-with-https-urls
    pause
    exit /b 1
)

echo ===== 工作已完成 ✅ =====
pause
endlocal