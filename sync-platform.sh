#!/bin/bash
# QUADS — Integrated Deployment Script
# Automates GitHub push (Vercel) and AWS EC2 synchronization.

set -e

# Configuration
BRANCH="bulleting"
EC2_USER="ec2-user"
EC2_IP="54.167.221.2"
PEM_KEY="quads-key.pem"
REMOTE_PATH="/home/ec2-user/quads"

echo "🚀 Starting Integrated Deployment for QUADS..."

# --- STEP 0: LOCAL BUILD ---
echo "🔨 Step 0: Building server locally..."
cd server
npm run build
cd ..

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

# Copy the fresh dist/ to EC2 first (since EC2 may not have TypeScript compiler)
echo "📤 Copying dist/ to EC2..."
scp -r -i "$PEM_KEY" -o StrictHostKeyChecking=no server/dist/* "$EC2_USER@$EC2_IP:$REMOTE_PATH/dist/"

ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << EOF
  # Load NVM and use Node 16
  export NVM_DIR="\$HOME/.nvm"
  [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
  nvm use 16
  
  echo "📡 Connected to EC2. Updating code in $REMOTE_PATH..."
  cd $REMOTE_PATH
  
  # Fetch latest code (for src/ files, package.json, etc.)
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
  
  # Verify .env exists
  if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env not found after git reset!"
    exit 1
  fi
  echo "✅ .env verified."
  
  # Update Backend dependencies
  echo "⚙️  Updating Backend dependencies..."
  cd server
  npm install --production
  
  # Build on EC2 (fallback in case dist/ wasn't copied)
  echo "🔨 Building server on EC2..."
  npm run build || echo "Build skipped (dist/ already synced)"
  cd ..
  
  # Restart API via PM2 — hard restart to ensure fresh code
  echo "♻️  Restarting quads-api..."
  pm2 delete quads-api 2>/dev/null || true
  pm2 start dist/app.js --name quads-api
  pm2 save
  
  echo "🔍 Deployment Logs:"
  pm2 status quads-api
EOF

echo "🎉 Deployment Sync Finished! Platform is up to date."
echo "📍 Frontend: https://quadsmarket.tech"
echo "📍 API: https://api.quadsmarket.tech/api/health"
echo "💡 Tip: Run 'pm2 logs quads-api' on EC2 to monitor."
