@echo off
echo ====================================
echo   Property CRM - Vercel Deployment
echo ====================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
    echo.
)

REM Navigate to server directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if user is logged in
echo Checking Vercel login status...
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo Please login to Vercel:
    call vercel login
    echo.
)

echo.
echo Choose deployment type:
echo 1. Preview Deployment (development)
echo 2. Production Deployment
echo 3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Deploying to preview environment...
    call vercel
) else if "%choice%"=="2" (
    echo.
    echo Deploying to production...
    call vercel --prod
) else if "%choice%"=="3" (
    echo.
    echo Exiting...
    exit /b 0
) else (
    echo.
    echo Invalid choice. Exiting...
    exit /b 1
)

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo.
echo View your deployments:
echo https://vercel.com/dashboard
echo.
pause
