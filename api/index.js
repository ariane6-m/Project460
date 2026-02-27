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
const { execFile } = require('child_process');
const xml2js = require('xml2js');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { User, Device, ScanHistory, Alert, initDb, sequelize } = require('./src/models');

const app = express();
const port = 8080;

const JWT_SECRET = 'your-secret-key'; // In a real app, use an environment variable

// Initialize Database
initDb();

// Store latest agent metrics and pending scan requests
let agentMetrics = {};
let pendingAgentScans = {};

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Agent Report Endpoint
app.post('/agent/report', rbac, async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Request body is required and must not be empty');
  }
  const { metrics, scanResults, target } = req.body;
  const userId = req.user.id;

  try {
    if (metrics) {
      agentMetrics[userId] = {
        ...metrics,
        timestamp: new Date().toISOString()
      };
    }

    if (scanResults && Array.isArray(scanResults)) {
      await ScanHistory.create({ 
        target: target || 'Local Agent Scan', 
        deviceCount: scanResults.length, 
        rawResults: scanResults,
        userId: userId
      });

      for (const dev of scanResults) {
        const deviceIdentifier = (dev.mac && dev.mac !== 'Unknown') ? { mac: dev.mac, userId: req.user.id } : { ip: dev.ip, userId: req.user.id };
        
        const [device, created] = await Device.findOrCreate({
          where: deviceIdentifier,
          defaults: { ...dev, lastSeen: new Date(), userId: req.user.id }
        });

        if (created) {
          await Alert.create({
            severity: 'Medium',
            message: `[Agent] New device detected: ${dev.ip} (${dev.hostname})`,
            deviceId: device.id,
            userId: req.user.id
          });
        } else {
          await device.update({ ...dev, lastSeen: new Date() });
        }
      }
    }

    const pendingScan = pendingAgentScans[userId];
    delete pendingAgentScans[userId]; 

    res.json({ 
      message: 'Report received successfully',
      pendingScan: pendingScan || null
    });
  } catch (err) {
    console.error('Agent report error:', err);
    res.status(500).send('Error processing agent report');
  }
});

// Registration endpoint
app.post('/register', async (req, res) => {
            message: `[Agent] New device: ${dev.ip}`,
            deviceId: device.id,
            userId
          });
        } else {
          await device.update({ ...dev, lastSeen: new Date() });
        }
      }
    }

    const pendingScan = pendingAgentScans[userId];
    delete pendingAgentScans[userId]; 

    res.json({ 
      message: 'Report received successfully',
      pendingScan: pendingScan || null
    });
  } catch (err) {
    console.error('Agent report error:', err);
    res.status(500).send('Error processing agent report');
  }
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, password, fullName, email } = req.body;

    if (!username || !password || !fullName || !email) {
        return res.status(400).send('All fields (username, password, fullName, email) are required.');
    }

    try {
        const existingUser = await User.findOne({ 
            where: { 
                [sequelize.Sequelize.Op.or]: [{ username }, { email }] 
            } 
        });

        if (existingUser) {
            return res.status(409).send('Username or email already exists.');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await User.create({ 
            username, 
            passwordHash, 
            role: 'Viewer',
            fullName,
            email
        });
        res.status(201).send('User registered successfully.');
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).send('Error registering user.');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ where: { username } });

        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const token = jwt.sign({ id: user.id, username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Error logging in.');
    }
});

// Admin - Get all users (Admin only)
app.get('/admin/users', rbac, async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['username', 'role', 'fullName', 'email'] });
        res.json(users);
    } catch (err) {
        res.status(500).send('Error fetching users.');
    }
});

// Admin - Change user role (Admin only)
app.put('/admin/users/:username/role', rbac, async (req, res) => {
    const { username } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'Admin' && role !== 'Viewer')) {
        return res.status(400).send('Invalid role specified. Role must be Admin or Viewer.');
    }

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).send('User not found.');
        }

        user.role = role;
        await user.save();
        res.send('User role updated successfully.');
    } catch (err) {
        res.status(500).send('Error updating user role.');
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

app.post('/scan', rbac, (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).send('Target is required');
  }

  const safeTargetPattern = /^[A-Za-z0-9\.\-_:\/]+$/;
  if (!safeTargetPattern.test(target)) {
    return res.status(400).send('Invalid target format');
  }

  const args = ['-T4', '-F', '-Pn', '-oX', '-', target];
  console.log(`Executing command: nmap ${args.join(' ')}`);

  execFile('nmap', args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error && error.code !== 1) {
      console.error(`execFile error: ${error}`);
      return res.status(500).send(`Error executing nmap: ${error.message}`);
    }

    xml2js.parseString(stdout, async (err, result) => {
      if (err) {
        console.error(`xml2js parse error: ${err}`);
        return res.status(500).send('Error parsing nmap output.');
      }
      
      if (!result || !result.nmaprun || !result.nmaprun.host) {
        await ScanHistory.create({ target, deviceCount: 0, rawResults: result, userId: req.user.id });
        return res.json([]);
      }

      try {
        const hosts = Array.isArray(result.nmaprun.host) ? result.nmaprun.host : [result.nmaprun.host];
        const scannedDevices = hosts.map(host => {
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

        // Save to History
        await ScanHistory.create({ target, deviceCount: scannedDevices.length, rawResults: scannedDevices, userId: req.user.id });

        // Update/Create Devices and generate alerts
        for (const dev of scannedDevices) {
          const deviceIdentifier = (dev.mac && dev.mac !== 'Unknown') ? { mac: dev.mac, userId: req.user.id } : { ip: dev.ip, userId: req.user.id };
          
          const [device, created] = await Device.findOrCreate({
            where: deviceIdentifier,
            defaults: { ...dev, lastSeen: new Date(), userId: req.user.id }
          });

          if (created) {
            await Alert.create({
              severity: 'Medium',
              message: `New device detected: ${dev.ip} (${dev.hostname})`,
              deviceId: device.id,
              userId: req.user.id
            });
          } else {
            await device.update({ ...dev, lastSeen: new Date() });
          }
        }

        res.json(scannedDevices);
      } catch (parseError) {
        console.error('Error processing nmap result:', parseError);
        res.status(500).send(`Error processing scan results: ${parseError.message}`);
      }
    });
  });
});

app.get('/devices', rbac, async (req, res) => {
  try {
    const devices = await Device.findAll({ 
      where: { userId: req.user.id },
      order: [['lastSeen', 'DESC']] 
    });
    res.json(devices);
  } catch (err) {
    res.status(500).send('Error fetching devices.');
  }
});

app.get('/alerts', rbac, async (req, res) => {
  try {
    const alerts = await Alert.findAll({ 
      where: { status: 'Active', userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).send('Error fetching alerts.');
  }
});

app.get('/events', rbac, (req, res) => {
  res.json(getEvents());
});

app.get('/devices/:id/history', rbac, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Safety check: Is it an integer ID or a string identifier (IP/MAC)?
    const isInteger = !isNaN(parseInt(id)) && /^\d+$/.test(id);

    const device = await Device.findOne({
      where: isInteger 
        ? { [sequelize.Sequelize.Op.or]: [{ id: parseInt(id) }, { ip: id }, { mac: id }], userId: req.user.id }
        : { [sequelize.Sequelize.Op.or]: [{ ip: id }, { mac: id }], userId: req.user.id }
    });

    if (!device) return res.status(404).send('Device not found');

    const history = await ScanHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const chartData = history.map(h => {
      // Find this device in the raw scan results of each history entry
      const deviceInScan = Array.isArray(h.rawResults) 
        ? h.rawResults.find(d => d.mac === device.mac || d.ip === device.ip)
        : null;

      return {
        timestamp: h.createdAt,
        status: deviceInScan ? 1 : 0,
        portCount: deviceInScan?.openPorts?.length || 0
      };
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(chartData);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).send('Error fetching device history.');
  }
});

app.get('/metrics/agent', rbac, (req, res) => {
  const metrics = agentMetrics[req.user.id];
  if (!metrics) return res.status(404).send('No agent data found');
  res.json(metrics);
});

// Endpoint for Dashboard to trigger an agent scan
app.post('/agent/scan', rbac, (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).send('Target is required');
  
  pendingAgentScans[req.user.id] = target;
  res.json({ message: 'Scan request queued for agent' });
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
    console.error('Error generating metrics:', ex);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
});
