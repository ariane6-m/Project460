function rbac(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).send('Forbidden: User role not available.');
  }

  const { role } = req.user;
  const namespace = req.params.namespace || req.body.namespace || req.query.namespace;

  if (role === 'Admin') {
    return next();
  }

  if (role === 'Viewer') {
    if (namespace === 'public') {
      return next();
    } else {
      return res.status(403).send('Forbidden: Viewers can only access the "public" namespace.');
    }
  }

  return res.status(403).send('Forbidden: Insufficient permissions.');
}

module.exports = rbac;
