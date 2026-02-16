const express = require('express');
const client = require('prom-client');
const rbac = require('./src/middleware/rbac');
const { auditMiddleware, getEvents } = require('./src/services/auditLogger');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Import bcryptjs

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

const os = require('os-utils');
const { exec } = require('child_process');
const xml2js = require('xml2js');

let devices = []; // In-memory storage for scanned devices

app.post('/scan', rbac, (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).send('Target is required');
  }

  // -T4 for faster timing, -F for fast port scan, -oX - for XML output to stdout
  const command = `nmap -T4 -F -oX - ${target}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error executing nmap: ${error.message}`);
    }
    if (stderr) {
      console.warn(`nmap stderr: ${stderr}`);
    }

    xml2js.parseString(stdout, (err, result) => {
      if (err) {
        console.error(`xml2js parse error: ${err}`);
        return res.status(500).send('Error parsing nmap output.');
      }
      if (!result || !result.nmaprun || !result.nmaprun.host) {
        devices = [];
        return res.json([]);
      }
      const hosts = Array.isArray(result.nmaprun.host) ? result.nmaprun.host : [result.nmaprun.host];
      devices = hosts.map(host => {
        const ip = host.address.find(a => a.$.addrtype === 'ipv4')?.$.addr;
        const mac = host.address.find(a => a.$.addrtype === 'mac')?.$.addr;
        const vendor = host.address.find(a => a.$.addrtype === 'mac')?.$.vendor;
        const hostname = host.hostnames[0]?.hostname[0]?.$.name || 'Unknown';

        const openPorts = host.ports[0]?.port
          ?.filter(p => p.state[0]?.$.state === 'open')
          .map(p => p.$.portid) || [];

        return {
          ip: ip || 'Unknown',
          hostname: hostname,
          vendor: vendor || 'Unknown',
          mac: mac || 'Unknown',
          status: host.status[0]?.$.state || 'Unknown',
          openPorts: openPorts,
        };
      });
      res.json(devices);
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
  const cpuUsage = await new Promise((resolve) => {
    os.cpuUsage(resolve);
  });

  const freeMem = os.freemem();
  const totalMem = os.totalmem();

  // Return network monitoring data as JSON
  res.json({
    timestamp: new Date().toISOString(),
    cpuUsage: cpuUsage,
    freeMemory: freeMem,
    totalMemory: totalMem,
    networkStats: {
      packetsReceived: Math.floor(Math.random() * 10000),
      packetsSent: Math.floor(Math.random() * 10000),
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesSent: Math.floor(Math.random() * 1000000),
      activeConnections: Math.floor(Math.random() * 100),
    }
  });
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