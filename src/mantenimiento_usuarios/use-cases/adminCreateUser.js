const { hash } = require('../security/password');

const adminCreateUser = ({ authRepo }) => async ({ nombre, apellido, fecha_nacimiento, correo, password, id_rol }) => {
  if (!id_rol || isNaN(parseInt(id_rol, 10))) {
    const e = new Error('El campo id_rol es requerido y debe ser un número.');
    e.status = 400;
    throw e;
  }

  const password_hash = await hash(password);

  const u = await authRepo.createPersonaUsuario({
    persona: { nombre, apellido, fecha_nacimiento },
    usuario: { correo_institucional: correo, password_hash, estado: 'activo' },
    roleIds: [id_rol],
  });

  return { id_usuario: u.id_usuario, correo: u.correo_institucional, roles: [id_rol] };
};

module.exports = { adminCreateUser };