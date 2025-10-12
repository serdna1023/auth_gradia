const { verifyAccess } = require('./jwt');

module.exports = (req, res, next) => {
  const hdr = req.headers.authorization || '';
  const [, token] = hdr.split(' ');
  if (!token) return res.status(401).json({ error: 'NO_AUTH_TOKEN' });
  try { req.user = verifyAccess(token); next(); }
  catch { res.status(401).json({ error: 'INVALID_OR_EXPIRED_TOKEN' }); }
};
