function rbac(req, res, next) {
  // Allow all users (including unauthenticated) to access metrics
  if (req.path === '/metrics' || req.path === '/metrics/json') {
    return next();
  }

  if (!req.user || !req.user.role) {
    return res.status(403).send('Forbidden: User role not available.');
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
