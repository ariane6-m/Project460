const auditLogs = []; // In-memory storage for audit logs
const MAX_LOGS = 100; // Keep the last 100 logs

function auditLogger(req, res, next) {
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
    const body = Buffer.concat(chunks).toString('utf8');

    const log = {
      timestamp: new Date().toISOString(),
      user: req.user ? req.user.id : 'anonymous',
      action: `${req.method} ${req.originalUrl}`,
      method: req.method, // Add method for easy filtering
      url: req.originalUrl, // Add url for easy display
      query: req.query,
      body: req.body,
      responseStatus: res.statusCode,
      // responseBody: body, // Optionally log response body if needed for debugging
    };

    auditLogs.push(log);
    if (auditLogs.length > MAX_LOGS) {
      auditLogs.shift(); // Remove the oldest log
    }

    oldEnd.apply(res, restArgs);
  };

  next();
}

module.exports = { auditLogger, auditLogs };
