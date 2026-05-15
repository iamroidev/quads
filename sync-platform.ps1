# QUADS - Integrated Deployment Script (PowerShell)
# Automates GitHub push (Vercel) and AWS EC2 synchronization.

$Branch = "bulleting"
$Ec2User = "ec2-user"
$Ec2Ip = "54.167.221.2"
$PemKey = "quads-key.pem"
$RemotePath = "/home/ec2-user/quads"

Write-Host "Starting Integrated Deployment for QUADS..."

# --- STEP 1: LOCAL PUSH (Frontend/Vercel) ---
Write-Host "Step 1: Pushing to GitHub [$Branch]..."
git add .
$CommitMsg = if ($args[0]) { $args[0] } else { "Production Update" }
git commit -m "$CommitMsg"
git push origin $Branch

Write-Host "GitHub Push Complete. Vercel is now rebuilding the frontend."

# --- STEP 2: REMOTE SYNC (AWS/Backend) ---
Write-Host "Step 2: Synchronizing AWS EC2 Backend..."

$RemoteCmds = 'export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm use 16; cd /home/ec2-user/quads; git fetch origin bulleting; git reset --hard origin/bulleting; cd server; npm install --production; npm run build; pm2 restart quads-api || pm2 start dist/app.js --name quads-api; pm2 status quads-api'

ssh -i $PemKey -o StrictHostKeyChecking=no "$Ec2User@$Ec2Ip" $RemoteCmds

Write-Host "Deployment Sync Finished! Platform is up to date."
Write-Host "Frontend: https://quadsmarket.tech"
Write-Host "API: https://api.quadsmarket.tech/api/health"
