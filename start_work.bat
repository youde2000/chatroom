chcp 65001
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

echo 1. 准备 Python %PYTHON_VERSION% 环境...
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

echo 2. 安装后端依赖...
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

echo 3. 安装前端依赖...
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

echo 4. 启动服务...
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