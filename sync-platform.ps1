# QUADS — Integrated Deployment Script (PowerShell)
# Automates GitHub push (Vercel) and AWS EC2 synchronization.

$Branch = "bulleting"
$Ec2User = "ec2-user"
$Ec2Ip = "54.167.221.2"
$PemKey = "quads-key.pem"
$RemotePath = "/home/ec2-user/quads"

Write-Host "🚀 Starting Integrated Deployment for QUADS..." -ForegroundColor Cyan

# --- STEP 1: LOCAL PUSH (Frontend/Vercel) ---
Write-Host "📦 Step 1: Pushing to GitHub [$Branch]..." -ForegroundColor Yellow
git add .
$CommitMsg = if ($args[0]) { $args[0] } else { "Production Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" }
git commit -m "$CommitMsg"
git push origin $Branch

Write-Host "✅ GitHub Push Complete. Vercel is now rebuilding the frontend." -ForegroundColor Green

# --- STEP 2: REMOTE SYNC (AWS/Backend) ---
Write-Host "🌐 Step 2: Synchronizing AWS EC2 Backend..." -ForegroundColor Yellow

$RemoteCmds = @"
  export NVM_DIR="`$HOME/.nvm"
  [ -s "`$NVM_DIR/nvm.sh" ] && \. "`$NVM_DIR/nvm.sh"
  nvm use 16
  echo '📡 Connected to EC2. Updating code...'
  cd $RemotePath
  git fetch origin $Branch
  git reset --hard origin/$Branch
  cd server
  npm install --production
  pm2 restart quads-api || pm2 start dist/app.js --name quads-api
  pm2 status quads-api
"@

ssh -i "$PemKey" -o "StrictHostKeyChecking=no" "$Ec2User@$Ec2Ip" "$RemoteCmds"

Write-Host "🎉 Deployment Sync Finished! Platform is up to date." -ForegroundColor Green
Write-Host "📍 Frontend: https://quadsmarket.tech" -ForegroundColor Cyan
Write-Host "📍 API: https://api.quadsmarket.tech/api/health" -ForegroundColor Cyan
