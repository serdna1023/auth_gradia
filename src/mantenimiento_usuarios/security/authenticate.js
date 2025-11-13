const { verifyAccess } = require('./jwt');

module.exports = (req, res, next) => {
    
    // --- 🔑 CAMBIO CLAVE: Leer desde el Header "Authorization" ---
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extraemos el token (ej: "Bearer eyJ...")
        token = authHeader.split(' ')[1];
    }
    // --- FIN CAMBIO ---

    if (!token) {
        // Si no hay token en el header, fallamos.
        return res.status(401).json({ message: 'NO AUTH TOKEN (Header missing)' });
    }

    try {
        // Verificamos el token (esto usará el JWT_SECRET)
        const payload = verifyAccess(token);
        req.user = payload; // Guardamos el payload (ej. {sub: 123}) en req.user
        next(); // Damos paso al controlador /me
    } catch (err) {
        // Si el JWT_SECRET no coincide o el token expiró
        return res.status(401).json({ message: 'INVALID OR EXPIRED TOKEN' });
    }
};