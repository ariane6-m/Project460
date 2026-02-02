const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../audit.log');

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
      query: req.query,
      body: req.body,
      responseStatus: res.statusCode,
    };

    const logLine = JSON.stringify(log) + '\n';

    fs.appendFile(logFilePath, logLine, (err) => {
      if (err) {
        console.error('Failed to write to audit log:', err);
      }
    });

    oldEnd.apply(res, restArgs);
  };

  next();
}


module.exports = auditLogger;
