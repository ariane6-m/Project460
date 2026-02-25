const express = require('express');
const client = require('prom-client');
const rbac = require('./src/middleware/rbac');
const { auditMiddleware, getEvents } = require('./src/services/auditLogger');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const os = require('os-utils');
const si = require('systeminformation');
const { exec } = require('child_process');
const xml2js = require('xml2js');

const app = express();
const port = 8080;

const JWT_SECRET = 'your-secret-key'; // In a real app, use an environment variable

// Temporary in-memory user store (replace with a database in a real application)
const users = [
  { username: 'admin', passwordHash: bcrypt.hashSync('password', 10), role: 'Admin' }
];

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// JWT authentication middleware
app.use((req, res, next) => {
  if (req.path === '/login' || req.path === '/register') { // Allow /register without token
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
});

// Audit logger middleware
app.use(auditMiddleware);

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    if (users.find(u => u.username === username)) {
        return res.status(409).send('Username already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { username, passwordHash, role: 'Viewer' }; // New users are 'Viewer' by default
    users.push(newUser);
    res.status(201).send('User registered successfully.');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.passwordHash)) {
        const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Admin - Get all users (Admin only)
app.get('/admin/users', rbac, (req, res) => {
    // Only return username and role
    const usersData = users.map(user => ({ username: user.username, role: user.role }));
    res.json(usersData);
});

// Admin - Change user role (Admin only)
app.put('/admin/users/:username/role', rbac, (req, res) => {
    const { username } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'Admin' && role !== 'Viewer')) {
        return res.status(400).send('Invalid role specified. Role must be Admin or Viewer.');
    }

    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).send('User not found.');
    }

    users[userIndex].role = role;
    res.send('User role updated successfully.');
});

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label 'app' to all metrics
register.setDefaultLabels({
  app: 'monitoring-api'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a custom counter metric
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Register the custom metric
register.registerMetric(httpRequestCounter);

// Middleware to count requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode
    });
  });
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/hello', (req, res) => {
    res.send('Hello again!');
});

let devices = []; // In-memory storage for scanned devices

app.post('/scan', rbac, (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).send('Target is required');
  }

  // -T4 for faster timing, -F for fast port scan, -oX - for XML output to stdout
  // Added -Pn to skip host discovery and treat all hosts as online
  const command = `nmap -T4 -F -Pn -oX - ${target}`;

  console.log(`Executing command: ${command}`);

  exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error executing nmap: ${error.message}`);
    }
    if (stderr) {
      console.warn(`nmap stderr: ${stderr}`);
    }

    console.log(`nmap stdout length: ${stdout.length}`);

    xml2js.parseString(stdout, (err, result) => {
      if (err) {
        console.error(`xml2js parse error: ${err}`);
        console.error(`Raw stdout (first 500 chars): ${stdout.substring(0, 500)}`);
        return res.status(500).send('Error parsing nmap output.');
      }
      
      if (!result || !result.nmaprun || !result.nmaprun.host) {
        console.log('No hosts found in nmap output.');
        devices = [];
        return res.json([]);
      }

      try {
        const hosts = Array.isArray(result.nmaprun.host) ? result.nmaprun.host : [result.nmaprun.host];
        devices = hosts.map(host => {
          const addresses = Array.isArray(host.address) ? host.address : (host.address ? [host.address] : []);
          
          const ip = addresses.find(a => a.$ && a.$.addrtype === 'ipv4')?.$.addr;
          const mac = addresses.find(a => a.$ && a.$.addrtype === 'mac')?.$.addr;
          const vendor = addresses.find(a => a.$ && a.$.addrtype === 'mac')?.$.vendor;
          
          let hostname = 'Unknown';
          if (host.hostnames && host.hostnames[0] && host.hostnames[0].hostname) {
            const hnames = Array.isArray(host.hostnames[0].hostname) ? host.hostnames[0].hostname : [host.hostnames[0].hostname];
            hostname = hnames[0]?.$.name || 'Unknown';
          }

          const portsArr = (host.ports && host.ports[0] && host.ports[0].port) ? 
                           (Array.isArray(host.ports[0].port) ? host.ports[0].port : [host.ports[0].port]) : [];

          const openPorts = portsArr
            ?.filter(p => p.state && p.state[0] && p.state[0].$ && p.state[0].$.state === 'open')
            .map(p => p.$.portid) || [];

          return {
            ip: ip || 'Unknown',
            hostname: hostname,
            vendor: vendor || 'Unknown',
            mac: mac || 'Unknown',
            status: (host.status && host.status[0] && host.status[0].$) ? host.status[0].$.state : 'Unknown',
            openPorts: openPorts,
          };
        });
        res.json(devices);
      } catch (parseError) {
        console.error('Error processing nmap result object:', parseError);
        console.error('Result object structure:', JSON.stringify(result, null, 2).substring(0, 1000));
        res.status(500).send(`Error processing scan results: ${parseError.message}`);
      }
    });
  });
});

app.get('/devices', rbac, (req, res) => {
  res.json(devices);
});

app.get('/alerts', rbac, (req, res) => {
  res.json([
    { id: 1, severity: 'Critical', time: new Date(), message: 'Unauthorized access attempt detected from 192.168.1.101' },
    { id: 2, severity: 'High', time: new Date(), message: 'Port scan detected from 10.0.0.5' },
    { id: 3, severity: 'Medium', time: new Date(), message: 'Unusual network traffic from device 192.168.1.55' },
  ]);
});

app.get('/events', rbac, (req, res) => {
  res.json(getEvents());
});

app.get('/devices/:id/history', rbac, (req, res) => {
  // In a real app, you would fetch this from a database
  res.json([
    { "timestamp": "2026-02-15T00:00:00Z", "temperature": 22.5, "humidity": 45.2 },
    { "timestamp": "2026-02-15T01:00:00Z", "temperature": 22.7, "humidity": 45.5 },
    { "timestamp": "2026-02-15T02:00:00Z", "temperature": 22.8, "humidity": 45.8 },
    { "timestamp": "2026-02-15T03:00:00Z", "temperature": 22.7, "humidity": 46.1 },
    { "timestamp": "2026-02-15T04:00:00Z", "temperature": 22.6, "humidity": 46.0 },
    { "timestamp": "2026-02-15T05:00:00Z", "temperature": 22.5, "humidity": 45.9 },
    { "timestamp": "2026-02-15T06:00:00Z", "temperature": 22.4, "humidity": 45.7 },
  ]);
});


app.get('/metrics/json', rbac, async (req, res) => {
  try {
    const [cpu, mem, network, netConns] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      si.networkConnections()
    ]);

    // Calculate free memory including buffers/cache for more "real" feel
    // mem.available is often better than mem.free
    const totalMemMB = mem.total / (1024 * 1024);
    const freeMemMB = mem.available / (1024 * 1024);

    res.json({
      timestamp: new Date().toISOString(),
      cpuUsage: cpu.currentLoad / 100,
      freeMemory: freeMemMB,
      totalMemory: totalMemMB,
      networkStats: {
        packetsReceived: network[0]?.rx_sec || 0,
        packetsSent: network[0]?.tx_sec || 0,
        bytesReceived: network[0]?.rx_bytes || 0,
        bytesSent: network[0]?.tx_bytes || 0,
        activeConnections: netConns.length,
      }
    });
  } catch (err) {
    console.error('Failed to fetch system stats:', err);
    // Fallback to simpler os-utils if si fails
    const cpuUsage = await new Promise((resolve) => {
      os.cpuUsage(resolve);
    });
    res.json({
      timestamp: new Date().toISOString(),
      cpuUsage: cpuUsage,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      networkStats: {
        packetsReceived: 0,
        packetsSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        activeConnections: 0,
      }
    });
  }
});

// Expose the metrics endpoint, now with RBAC
app.get('/metrics/:namespace?', rbac, async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});


app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});