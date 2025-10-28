const { Rol } = require('../../SequelizeModels');

const getMyProfile = ({ authRepo }) => async ({ userId }) => {
  const user = await authRepo.findUsuarioById(userId, {
    include: [{
      model: Rol,
      as: 'Rols',
      attributes: ['nombre_rol'],
      through: { attributes: [] }
    }]
  });

  if (!user) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }

  // Formateamos la respuesta para devolver solo lo necesario
  return {
    id_usuario: user.id_usuario,
    correo_institucional: user.correo_institucional,
    roles: user.Rols ? user.Rols.map(rol => rol.nombre_rol) : [],
  };
};

module.exports = { getMyProfile };