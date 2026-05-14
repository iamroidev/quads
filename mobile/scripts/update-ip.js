const fs = require('fs');
const path = require('path');

// Get local IP address
const os = require('os');
const interfaces = os.networkInterfaces();
const addresses = [];

for (const name of Object.keys(interfaces)) {
  // Skip virtual interfaces
  if (name.toLowerCase().includes('vmware') || 
      name.toLowerCase().includes('virtualbox') || 
      name.toLowerCase().includes('vbox') ||
      name.toLowerCase().includes('virtual')) {
    continue;
  }

  for (const iface of interfaces[name]) {
    // Skip IPv6 and internal addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      // Skip APIPA (Link-local) addresses
      if (iface.address.startsWith('169.254')) {
        continue;
      }
      addresses.push(iface.address);
    }
  }
}

// If we didn't find any real ones, look at everything but internal
if (addresses.length === 0) {
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
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

// Update .env file
const envPath = path.join(__dirname, '..', '.env');
try {
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace IPs in EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SOCKET_URL
    // Matches http://[IP]:[PORT]
    const ipRegex = /(https?:\/\/)([^:\/]+)(:\d+)?/g;
    
    envContent = envContent.replace(
      /EXPO_PUBLIC_API_URL=(https?:\/\/)([^:\/]+)(:\d+)?(\/.*)?/g,
      (match, protocol, oldIp, port, path) => {
        return `EXPO_PUBLIC_API_URL=${protocol}${ipAddress}${port || ':5000'}${path || '/api'}`;
      }
    );
    
    envContent = envContent.replace(
      /EXPO_PUBLIC_SOCKET_URL=(https?:\/\/)([^:\/]+)(:\d+)?/g,
      (match, protocol, oldIp, port) => {
        return `EXPO_PUBLIC_SOCKET_URL=${protocol}${ipAddress}${port || ':5000'}`;
      }
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('.env updated successfully');
  } else {
    console.warn('.env file not found, skipping update');
  }
} catch (err) {
  console.error('Error updating .env:', err);
}
