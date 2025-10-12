module.exports = (required) => (req, res, next) => {
  const roles = req.user?.roles || []; // si incluyes roles en el JWT en el futuro
  const needed = Array.isArray(required) ? required : [required];
  const ok = needed.some(r => roles.includes(r));
  if (!ok) return res.status(403).json({ error: 'FORBIDDEN' });
  next();
};
