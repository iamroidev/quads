const fs = require('fs');
const path = require('path');

// Get local IP address
const os = require('os');
const interfaces = os.networkInterfaces();
const addresses = [];

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push(iface.address);
    }
  }
}

const ipAddress = addresses[0] || 'localhost';
console.log(`Detected IP address: ${ipAddress}`);

// Read app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
let appJson;
try {
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  appJson = JSON.parse(appJsonContent);
} catch (err) {
  console.error('Error reading app.json:', err);
  process.exit(1);
}

// Update API and Socket URLs with the detected IP
if (appJson.extra) {
  const apiUrl = appJson.extra.apiUrl;
  const socketUrl = appJson.extra.socketUrl;
  
  // Extract protocol and port from existing URLs
  const apiParts = apiUrl.match(/^(https?:\/\/)([^:\/]+)(:\d+)?(\/.*)?$/);
  const socketParts = socketUrl.match(/^(https?:\/\/)([^:\/]+)(:\d+)?(\/.*)?$/);
  
  if (apiParts) {
    const protocol = apiParts[1];
    const port = apiParts[3] || ':5000';
    const path = apiParts[4] || '/api';
    appJson.extra.apiUrl = `${protocol}${ipAddress}${port}${path}`;
  }
  
  if (socketParts) {
    const protocol = socketParts[1];
    const port = socketParts[3] || ':5000';
    appJson.extra.socketUrl = `${protocol}${ipAddress}${port}`;
  }
}

// Write updated app.json
try {
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('app.json updated successfully');
} catch (err) {
  console.error('Error writing app.json:', err);
  process.exit(1);
}
