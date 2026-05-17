const fs = require('fs');
const path = require('path');

const rootEnvPath = path.join(__dirname, '../.env');

if (!fs.existsSync(rootEnvPath)) {
  console.error('❌ Root .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(rootEnvPath, 'utf8');

const targets = [
  'server/.env',
  'web/.env',
  'mobile/.env'
];

targets.forEach(target => {
  const targetPath = path.join(__dirname, '../', target);
  const targetDir = path.dirname(targetPath);
  
  if (fs.existsSync(targetDir)) {
    console.log(`同步 (Syncing) -> ${target}`);
    fs.writeFileSync(targetPath, envContent);
  } else {
    console.warn(`⚠️ Skipping ${target}: Directory not found`);
  }
});

console.log('✅ Environment variables synchronized across all packages.');
