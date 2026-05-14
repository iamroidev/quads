#!/bin/bash
# EC2 User Data - runs on first boot
yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create app directory
mkdir -p /home/ec2-user/quads
cd /home/ec2-user/quads

# The app code will be copied here via SCP or Git
# Then run: npm install && npm run build && pm2 start dist/app.js --name quads-api

echo "QUADS server setup complete. Deploy your code and run pm2 start."