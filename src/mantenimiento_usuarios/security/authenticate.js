const { verifyAccess } = require('./jwt');

module.exports = (req, res, next) => {
    
    // --- 🔑 CAMBIO: Volvemos a leer la COOKIE ---
    const token = req.cookies.accessToken;
    // --- FIN CAMBIO ---

    if (!token) {
        return res.status(401).json({ message: 'NO AUTH TOKEN (Cookie missing)' });
    }

    try {
        const payload = verifyAccess(token);
        req.user = payload; 
        next(); 
    } catch (err) {
        // Si el JWT_SECRET no coincide o el token expiró
        return res.status(401).json({ message: 'INVALID OR EXPIRED TOKEN' });
    }
};