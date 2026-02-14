const express = require('express');
const client = require('prom-client');
const rbac = require('./src/middleware/rbac');
const { auditLogger } = require('./src/services/auditLogger');


const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// This is a placeholder for your actual authentication middleware
// It should populate req.user with the user's data, including their role
app.use((req, res, next) => {
  // For demonstration purposes, we'll add a mock user.
  // In a real application, you would implement proper authentication (e.g., JWT, OAuth).
  // You can change 'Viewer' to 'Admin' to test different roles.
  req.user = { id: 'mockuser', role: 'Viewer' };
  next();
});

// Audit logger middleware
app.use(auditLogger);

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

// Add to your api/index.js
app.get('/metrics/json', (req, res) => {
  // Return network monitoring data as JSON
  res.json({
    timestamp: new Date().toISOString(),
    networkStats: {
      packetsReceived: Math.floor(Math.random() * 10000),
      packetsSent: Math.floor(Math.random() * 10000),
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesSent: Math.floor(Math.random() * 1000000),
      activeConnections: Math.floor(Math.random() * 100),
    }
  });
});