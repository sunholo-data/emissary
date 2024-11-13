const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to firebase.json in the root of the app
const firebaseConfigPath = path.resolve(__dirname, '../../firebase.json');

// Load firebase.json
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Extract emulator ports
const emulatorPorts = Object.entries(firebaseConfig.emulators).reduce((acc, [service, config]) => {
  if (config.port) acc.push(config.port);
  return acc;
}, []);

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const check = spawn('lsof', ['-i', `:${port}`]);
    check.on('exit', (code) => {
      resolve(code === 0); // code 0 means the port is in use
    });
  });
}

// Function to start a service with logging
function startService(command, args, name) {
  const service = spawn(command, args);

  // Stream logs from stdout
  service.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString()}`);
  });

  // Stream logs from stderr
  service.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString()}`);
  });

  service.on('close', (code) => {
    if (code !== 0) {
      console.log(`[${name}] exited with code ${code}`);
    }
  });
}

// Check all emulator ports and start services
async function checkAndStart() {
  // Check if any emulator ports are in use
  const inUse = await Promise.all(emulatorPorts.map(isPortInUse));
  
  if (inUse.some((port) => port)) {
    console.log('Firebase emulators already running on one or more required ports.');
  } else {
    console.log('Starting Firebase emulators...');
    startService('firebase', ['emulators:start'], 'Firebase');
  }

  // Check Next.js (port 3000)
  const nextPortInUse = await isPortInUse(3000);
  if (nextPortInUse) {
    console.log('Next.js already running on port 3000.');
  } else {
    console.log('Starting Next.js...on port 3000');
    startService('npx', ['next', 'dev'], 'Next.js');
  }

  // Check Python backend (port 1956)
  const pythonPortInUse = await isPortInUse(1956);
  if (pythonPortInUse) {
    console.log('Python backend already running on port 1956.');
  } else {
    console.log('Starting Python backend...');
    startService('python', ['backend/app.py'], 'Python');
  }
}

// Run the check and start function
checkAndStart();