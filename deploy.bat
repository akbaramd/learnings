@echo off
echo Starting Next.js Application Deployment with PM2...

REM Set environment variables
set NODE_ENV=production
set PORT=3000

REM Navigate to project directory
cd /d "%~dp0"

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Build the Next.js application
echo Building Next.js application...
call npm run build

REM Create logs directory if it doesn't exist
if not exist "logs" (
    mkdir logs
)

REM Stop existing PM2 processes
echo Stopping existing PM2 processes...
pm2 stop learnings-nextjs 2>nul
pm2 delete learnings-nextjs 2>nul

REM Start the application with PM2
echo Starting application with PM2...
pm2 start ecosystem.config.js --env production

REM Save PM2 configuration
echo Saving PM2 configuration...
pm2 save

REM Setup PM2 startup script
echo Setting up PM2 startup...
pm2 startup

REM Show PM2 status
echo PM2 Status:
pm2 status

echo.
echo Deployment completed successfully!
echo Application is running on http://localhost:3000
echo.
echo Useful PM2 commands:
echo   pm2 status          - Check application status
echo   pm2 logs            - View application logs
echo   pm2 restart all     - Restart all applications
echo   pm2 stop all        - Stop all applications
echo   pm2 monit           - Monitor applications
echo.
pause
