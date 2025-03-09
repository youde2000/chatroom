@echo off
setlocal enabledelayedexpansion

echo ===== 开始工作 =====

REM 验证 conda 是否可用
where conda >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 conda，请确保 Miniconda 已正确安装并配置
    pause
    exit /b 1
)

set "ENV_NAME=chatroom"
set "PYTHON_VERSION=3.11"

echo 1. 检查本地更改...
REM 检查是否有未提交的更改
git diff --quiet
if %errorlevel% neq 0 (
    echo ⚠️ 检测到未提交的更改，请选择操作：
    echo   1. 暂存更改并继续（推荐）
    echo   2. 丢弃更改并拉取最新代码
    echo   3. 退出脚本
    set /p choice=请输入选项 (1/2/3): 

    if "!choice!"=="1" (
        echo ✅ 正在暂存更改...
        git add . || (echo ❌ 暂存更改失败 & pause & exit /b 1)
        git stash || (echo ❌ 暂存更改失败 & pause & exit /b 1)
        echo ✅ 未提交的更改已暂存
    ) else if "!choice!"=="2" (
        echo ⚠️ 正在丢弃本地更改...
        git reset --hard HEAD || (echo ❌ 丢弃更改失败 & pause & exit /b 1)
        git clean -fd || (echo ❌ 清理未跟踪文件失败 & pause & exit /b 1)
        echo ✅ 本地更改已丢弃
    ) else if "!choice!"=="3" (
        echo ❌ 用户选择退出脚本
        pause
        exit /b 0
    ) else (
        echo ❌ 无效选项，退出脚本
        pause
        exit /b 1
    )
)

echo 2. 拉取最新代码...
git pull origin main
if %errorlevel% neq 0 (
    echo ❌ 代码拉取失败
    pause
    exit /b 1
)

echo 3. 准备 Python %PYTHON_VERSION% 环境...
REM 检查环境是否存在
conda env list | findstr /c:"%ENV_NAME%" >nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 conda 环境 '%ENV_NAME%'，正在创建环境...
    conda create -n %ENV_NAME% python=%PYTHON_VERSION% -y || (echo ❌ 环境创建失败 & pause & exit /b 1)
)

REM 激活环境
call conda activate %ENV_NAME%
if %errorlevel% neq 0 (
    echo ❌ 环境激活失败
    pause
    exit /b 1
)
python --version

echo 4. 安装后端依赖...
cd backend
if %errorlevel% neq 0 (
    echo ❌ 进入 backend 目录失败
    pause
    exit /b 1
)
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)
cd ..

echo 5. 安装前端依赖...
cd frontend
if %errorlevel% neq 0 (
    echo ❌ 进入 frontend 目录失败
    pause
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)
cd ..

echo 6. 启动服务...
REM 获取 Python 解释器的绝对路径
for /f "tokens=*" %%i in ('conda run -n %ENV_NAME% where python') do (
    set "PYTHON_PATH=%%i"
    goto :path_found
)
:path_found

REM 启动后端服务
start cmd /k "cd /d %cd%\backend && "%PYTHON_PATH%" -m app.main"

REM 启动前端服务
start cmd /k "cd /d %cd%\frontend && npm start"

echo ===== 环境已就绪 ✅ =====
pause
endlocal