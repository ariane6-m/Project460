const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');

// Create the log directory if it doesn't exist, handling permission errors
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Could not create log directory at ${logDir}. Falling back to console-only logging.`, err.message);
}

// Configure Winston loggers
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Only add file transport if the directory is writable
try {
  if (fs.existsSync(logDir)) {
    transports.push(
      new DailyRotateFile({
        level: 'info',
        filename: path.join(logDir, 'audit-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
      })
    );
  }
} catch (err) {
  console.error('Failed to initialize file logging:', err.message);
}

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: transports
});

const MAX_EVENTS = 100;
const events = [];

// Middleware for logging audit events
function auditMiddleware(req, res, next) {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];

  res.write = (...restArgs) => {
    chunks.push(Buffer.from(restArgs[0]));
    oldWrite.apply(res, restArgs);
  };

  res.end = (...restArgs) => {
    if (restArgs[0]) {
      chunks.push(Buffer.from(restArgs[0]));
    }
    const responseBody = Buffer.concat(chunks).toString('utf8');

    const event = {
      timestamp: new Date().toISOString(),
      user: req.user ? req.user.username : 'anonymous',
      userId: req.user ? req.user.id : null,
      action: `${req.method} ${req.originalUrl}`,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      query: req.query,
      body: req.body,
      responseStatus: res.statusCode,
      responseBody: responseBody,
      userAgent: req.headers['user-agent']
    };

    // Log the audit event using Winston
    auditLogger.info('HTTP Request', event);

    // Store event in memory
    events.unshift(event);
    if (events.length > MAX_EVENTS) {
      events.pop();
    }

    oldEnd.apply(res, restArgs);
  };

  next();
}

function getEvents() {
  return events;
}

module.exports = { auditMiddleware, getEvents };
