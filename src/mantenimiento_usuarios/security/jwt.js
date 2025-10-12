const jwt = require('jsonwebtoken');
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}
function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
module.exports = { signAccess, verifyAccess };
