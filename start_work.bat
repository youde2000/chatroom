@echo off
setlocal enabledelayedexpansion

echo ===== 开始工作 =====

REM 验证 conda 是否可用
where conda >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到 conda，请确保 Miniconda 已正确安装并配置
    exit /b 1
)

set "ENV_NAME=py311"

echo 1. 拉取最新代码...
git pull origin main
if %errorlevel% neq 0 (
    echo ❌ 代码拉取失败
    exit /b 1
)

echo 2. 准备 Python 3.11 环境...
REM 创建环境（如果不存在）
conda env list | findstr /c:"%ENV_NAME%" >nul
if %errorlevel% neq 0 (
    echo 正在创建 conda 环境...
    conda create -n %ENV_NAME% python=3.11 -y
    if %errorlevel% neq 0 (
        echo ❌ 环境创建失败
        exit /b 1
    )
)

REM 激活环境
call conda activate %ENV_NAME%
if %errorlevel% neq 0 (
    echo ❌ 环境激活失败
    exit /b 1
)
python --version

echo 3. 安装后端依赖...
cd backend
if %errorlevel% neq 0 (
    echo ❌ 进入 backend 目录失败
    exit /b 1
)
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ 后端依赖安装失败
    exit /b 1
)
cd ..

echo 4. 安装前端依赖...
cd frontend
if %errorlevel% neq 0 (
    echo ❌ 进入 frontend 目录失败
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo ❌ 前端依赖安装失败
    exit /b 1
)
cd ..

echo 5. 启动服务...
REM 获取 Python 绝对路径
for /f "tokens=*" %%i in ('conda run -n %ENV_NAME% where python') do (
    set "PYTHON_PATH=%%i"
    goto :path_found
)
:path_found

start cmd /k "cd /d %cd%\backend && "%PYTHON_PATH%" -m app.main"
start cmd /k "cd /d %cd%\frontend && npm start"

echo ===== 环境已就绪 ✅ =====
endlocal