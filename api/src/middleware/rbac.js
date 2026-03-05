function rbac(req, res, next) {
  // Allow unauthenticated access ONLY to the base /metrics endpoint (for Prometheus scraping)
  if (req.path === '/metrics') {
    return next();
  }

  // All other metrics (/metrics/json, /metrics/agent) and routes require an authenticated user
  if (!req.user || !req.user.role) {
    return res.status(401).send('Unauthorized: User authentication required.');
  }

  const { role } = req.user;

  // Restrict /admin/* routes to Admin only
  if (req.path.startsWith('/admin') && role !== 'Admin') {
    return res.status(403).send('Forbidden: Only Admin users can access administrative functions.');
  }

  // Safely access namespace from req.params, req.body, or req.query
  const namespace = (req.params && req.params.namespace) ||
                    (req.body && req.body.namespace) ||
                    (req.query && req.query.namespace);

  if (role === 'Admin') {
    return next();
  }

  if (role === 'Viewer') {
    // Viewers can only access the 'public' namespace if a namespace is provided
    if (namespace && namespace !== 'public') {
      return res.status(403).send('Forbidden: Viewers can only access the "public" namespace.');
    }
    return next();
  }

  return res.status(403).send('Forbidden: Insufficient permissions.');
}

module.exports = rbac;
