const { hash } = require('../security/password');
const { ESTUDIANTE } = require('../../constants/roles');

const registerPublicUser = ({ authRepo }) => async ({ nombre, apellido, fecha_nacimiento, correo, password }) => {
  const password_hash = await hash(password);
  const u = await authRepo.createPersonaUsuario({
    persona: { nombre, apellido, fecha_nacimiento },
    usuario: { correo_institucional: correo, password_hash, estado: 'activo' },
    roles: [ESTUDIANTE],
  });
  return { id_usuario: u.id_usuario, correo: u.correo_institucional, roles: [ESTUDIANTE] };
};
module.exports = { registerPublicUser };
