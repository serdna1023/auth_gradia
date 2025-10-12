const { hash } = require('../security/password');
const { ALLOWED_ADMIN_ROLES } = require('../../constants/roles');

const adminCreateUser = ({ authRepo }) => async ({ nombre, apellido, fecha_nacimiento, correo, password, rol }) => {
  if (!ALLOWED_ADMIN_ROLES.includes(rol)) { const e = new Error('ROL_NO_PERMITIDO'); e.status = 400; throw e; }
  const password_hash = await hash(password);
  const u = await authRepo.createPersonaUsuario({
    persona: { nombre, apellido, fecha_nacimiento },
    usuario: { correo_institucional: correo, password_hash, estado: 'activo' },
    roles: [rol],
  });
  return { id_usuario: u.id_usuario, correo: u.correo_institucional, roles: [rol] };
};
module.exports = { adminCreateUser };
