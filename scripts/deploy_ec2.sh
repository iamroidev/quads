#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 16
nvm use 16
npm install -g pm2@5
# Ensure old PM2 instances are gone
pm2 kill || true
cd /home/ec2-user/quads
tar -xzf quads-server.tar.gz
mv .env.production .env || true
npm install --production
pm2 start dist/app.js --name quads-api
pm2 save
