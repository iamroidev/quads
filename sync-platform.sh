#!/bin/bash
# QUADS — Integrated Deployment Script
# Automates GitHub push (Vercel) and AWS EC2 synchronization.

set -e

# Configuration
BRANCH="bulleting"
EC2_USER="ec2-user"
EC2_IP="54.167.221.2" # Your actual AWS IP from NEXT_STEPS.md
PEM_KEY="quads-key.pem"
REMOTE_PATH="/home/ec2-user/quads" # Corrected path on server

echo "🚀 Starting Integrated Deployment for QUADS..."

# --- STEP 1: LOCAL PUSH (Frontend/Vercel) ---
echo "📦 Step 1: Pushing to GitHub [$BRANCH]..."
git add .
# Use a default message if none provided
MSG=${1:-"Production Update: $(date +'%Y-%m-%d %H:%M:%S')"}
git commit -m "$MSG" || echo "Nothing to commit"
git push origin $BRANCH

echo "✅ GitHub Push Complete. Vercel is now rebuilding the frontend."

# --- STEP 2: REMOTE SYNC (AWS/Backend) ---
echo "🌐 Step 2: Synchronizing AWS EC2 Backend..."

ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << EOF
  # Load NVM and use Node 16
  export NVM_DIR="\$HOME/.nvm"
  [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
  nvm use 16
  
  echo "📡 Connected to EC2. Updating code in $REMOTE_PATH..."
  cd $REMOTE_PATH
  
  # Fetch latest code
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
  
  # Update Backend
  echo "⚙️  Updating Backend dependencies..."
  cd server
  npm install --production
  
  # Restart API via PM2
  echo "♻️  Restarting quads-api..."
  pm2 restart quads-api || pm2 start dist/app.js --name quads-api
  
  echo "🔍 Deployment Logs:"
  pm2 status quads-api
EOF

echo "🎉 Deployment Sync Finished! Platform is up to date."
echo "📍 Frontend: https://quadsmarket.tech"
echo "📍 API: https://api.quadsmarket.tech/api/health"
