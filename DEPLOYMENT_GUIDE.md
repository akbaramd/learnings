# Next.js + PM2 + IIS Deployment Guide

## Overview
This guide explains how to deploy a Next.js application using PM2 as a process manager and IIS as a reverse proxy on Windows Server.

## Prerequisites

### 1. Install Required Software
```bash
# Install Node.js (LTS version recommended)
# Download from: https://nodejs.org/

# Install PM2 globally
npm install -g pm2

# Install IIS URL Rewrite Module
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
```

### 2. Verify Installation
```bash
node --version
npm --version
pm2 --version
```

## Project Structure
```
learnings/
├── app/                    # Next.js app directory
├── .next/                  # Build output (generated)
├── public/                 # Static assets
├── ecosystem.config.js     # PM2 configuration
├── web.config             # IIS configuration
├── deploy.bat             # Windows deployment script
├── deploy.sh              # Linux deployment script
├── package.json           # Dependencies and scripts
└── next.config.ts         # Next.js configuration
```

## Configuration Files

### 1. PM2 Ecosystem Configuration (`ecosystem.config.js`)
- **Purpose**: Defines how PM2 should manage your Next.js application
- **Key Features**:
  - Cluster mode for multi-core utilization
  - Automatic restarts and health monitoring
  - Log management and rotation
  - Memory limit protection

### 2. Next.js Configuration (`next.config.ts`)
- **Purpose**: Optimizes Next.js for production deployment
- **Key Features**:
  - Standalone output for PM2 compatibility
  - Security headers
  - Performance optimizations
  - Webpack optimizations

### 3. IIS Configuration (`web.config`)
- **Purpose**: Configures IIS as a reverse proxy
- **Key Features**:
  - URL rewriting for Next.js routing
  - Static file handling
  - Security headers
  - Error page handling

## Deployment Process

### Method 1: Using Deployment Scripts

#### Windows (PowerShell/CMD)
```bash
# Navigate to project directory
cd D:\Github\Test\learnings

# Run deployment script
.\deploy.bat
```

#### Linux/macOS
```bash
# Navigate to project directory
cd /path/to/learnings

# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

### Method 2: Manual Deployment

#### Step 1: Build the Application
```bash
npm install
npm run build  # Uses --webpack flag to avoid Turbopack conflicts
```

#### Step 2: Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Step 3: Configure IIS
1. Open IIS Manager
2. Create a new website or use existing one
3. Set physical path to your project directory
4. Copy `web.config` to the root directory
5. Install URL Rewrite Module if not already installed

## IIS Setup Instructions

### 1. Create IIS Website
1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Configure:
   - **Site name**: `learnings-nextjs`
   - **Physical path**: `D:\Github\Test\learnings`
   - **Port**: `80` (or your preferred port)
   - **Host name**: Your domain (optional)

### 2. Install URL Rewrite Module
1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the module
3. Restart IIS

### 3. Configure Application Pool
1. Select your website
2. Go to **Application Pools**
3. Set **.NET CLR Version** to **No Managed Code**
4. Set **Managed Pipeline Mode** to **Integrated**

## PM2 Management Commands

### Basic Commands
```bash
# Start application
npm run pm2:start

# Stop application
npm run pm2:stop

# Restart application
npm run pm2:restart

# Delete application
npm run pm2:delete

# View logs
npm run pm2:logs

# Check status
npm run pm2:status

# Monitor applications
npm run pm2:monit
```

### Advanced PM2 Commands
```bash
# View detailed information
pm2 show learnings-nextjs

# Reload application (zero-downtime)
pm2 reload learnings-nextjs

# Scale application
pm2 scale learnings-nextjs 4

# View logs with filtering
pm2 logs learnings-nextjs --lines 100

# Clear logs
pm2 flush
```

## Monitoring and Maintenance

### 1. Health Monitoring
- PM2 automatically monitors application health
- Automatic restarts on crashes
- Memory usage monitoring
- CPU usage tracking

### 2. Log Management
- Logs are stored in `./logs/` directory
- Automatic log rotation
- Separate error and output logs
- Combined log for comprehensive view

### 3. Performance Optimization
- Cluster mode utilizes all CPU cores
- Memory limits prevent resource exhaustion
- Automatic restarts on memory leaks
- Built-in load balancing

## Troubleshooting

### Common Issues

#### 1. PM2 Process Not Starting
```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs learnings-nextjs --err

# Restart PM2 daemon
pm2 kill
pm2 resurrect
```

#### 2. IIS Proxy Issues
- Verify URL Rewrite Module is installed
- Check `web.config` syntax
- Ensure Next.js is running on port 3000
- Check IIS logs for errors

#### 3. Next.js Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# If you encounter Turbopack errors, use webpack explicitly
npm run build -- --webpack

# Check for TypeScript errors
npm run lint
```

#### 4. Port Conflicts
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Change port in ecosystem.config.js
# Update IIS web.config accordingly
```

### Debugging Steps
1. Check PM2 logs: `pm2 logs learnings-nextjs`
2. Verify IIS configuration
3. Test Next.js directly: `https://auth.wa-nezam.org`
4. Check Windows Event Viewer for IIS errors
5. Verify firewall settings

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data to version control
- Use environment-specific configuration files
- Implement proper secret management

### 2. IIS Security
- Enable HTTPS with SSL certificates
- Configure proper authentication if needed
- Regular security updates

### 3. PM2 Security
- Run PM2 with appropriate user permissions
- Monitor for unauthorized access
- Regular security audits

## Performance Optimization

### 1. Next.js Optimizations
- Enable compression
- Optimize images
- Use CDN for static assets
- Implement caching strategies

### 2. PM2 Optimizations
- Adjust cluster size based on CPU cores
- Monitor memory usage
- Configure appropriate restart policies
- Use PM2 Plus for advanced monitoring

### 3. IIS Optimizations
- Enable compression
- Configure caching headers
- Optimize static file serving
- Use Application Request Routing (ARR) for load balancing

## Backup and Recovery

### 1. Application Backup
```bash
# Backup application files
tar -czf learnings-backup-$(date +%Y%m%d).tar.gz learnings/

# Backup PM2 configuration
pm2 save
```

### 2. Recovery Process
```bash
# Restore application files
tar -xzf learnings-backup-YYYYMMDD.tar.gz

# Restore PM2 processes
pm2 resurrect
```

## Conclusion

This setup provides a robust, scalable solution for deploying Next.js applications on Windows Server with PM2 and IIS. The configuration ensures high availability, performance, and maintainability while following enterprise-grade best practices.

For additional support or advanced configurations, refer to the official documentation:
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [IIS URL Rewrite](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/)
