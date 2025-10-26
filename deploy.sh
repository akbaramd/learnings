#!/bin/bash

# Next.js Application Deployment Script for PM2
# This script handles the complete deployment process

set -e  # Exit on any error

echo "Starting Next.js Application Deployment with PM2..."

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 stop learnings-nextjs 2>/dev/null || true
pm2 delete learnings-nextjs 2>/dev/null || true

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script (only if not already configured)
echo "Setting up PM2 startup..."
pm2 startup 2>/dev/null || echo "PM2 startup already configured"

# Show PM2 status
echo "PM2 Status:"
pm2 status

echo ""
echo "Deployment completed successfully!"
echo "Application is running on https://auth.wa-nezam.org"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  pm2 restart all     - Restart all applications"
echo "  pm2 stop all        - Stop all applications"
echo "  pm2 monit           - Monitor applications"
echo ""
