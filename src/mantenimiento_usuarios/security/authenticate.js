const { verifyAccess } = require('./jwt');

module.exports = (req, res, next) => {
  // Leemos el token de la cookie 'accessToken' en lugar de la cabecera 'Authorization'.
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'NO_AUTH_TOKEN' });
  }

  try {
    // Verificamos el token que vino de la cookie
    const payload = verifyAccess(token);
    req.user = payload; // Guardamos el payload (ej. { sub: 123 }) en req.user
    next(); // Damos paso a la siguiente función (el controlador /me)
  } catch (err) {
    // Si el token es inválido o ha expirado
    return res.status(401).json({ message: 'INVALID_OR_EXPIRED_TOKEN' });
  }
};