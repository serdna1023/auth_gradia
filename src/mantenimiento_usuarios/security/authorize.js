const { Usuario, Rol } = require('../../SequelizeModels');
/**
 * @param {string} requiredRole
 * @returns {function}
 */
module.exports = (requiredRole) => async (req, res, next) => {
  try {
    // 1. Obtenemos el ID del usuario del token que el middleware 'authenticate' ya verificó.
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(403).json({ error: 'FORBIDDEN - User ID not found in token' });
    }

    // 2. Buscamos al usuario y sus roles asociados directamente en la base de datos.
    const user = await Usuario.findByPk(userId, {
      include: {
        model: Rol,
        as: 'Rols',
        through: { attributes: [] }
      }
    });

    if (!user || !user.Rols || user.Rols.length === 0) {
      return res.status(403).json({ error: 'FORBIDDEN - User not found or has no roles' });
    }

    const userRoles = user.Rols.map(rol => rol.nombre_rol);

    if (!userRoles.includes(requiredRole)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    next();

  } catch (error) {
    console.error('Error in authorization middleware:', error);
    return res.status(500).json({ error: 'Internal server error during authorization' });
  }
};