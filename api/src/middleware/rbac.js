function rbac(req, res, next) {
  // Allow all authenticated users to access metrics endpoints
  if (req.path === '/metrics' || req.path === '/metrics/json' || req.path === '/scan') {
    return next();
  }

  if (!req.user || !req.user.role) {
    return res.status(403).send('Forbidden: User role not available.');
  }

  const { role } = req.user;
  const namespace = req.params.namespace || req.body.namespace || req.query.namespace;

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
