const { hash } = require('../security/password');

const registerPublicUser = ({ authRepo }) => async ({ nombre, apellido, fecha_nacimiento, correo, password }) => {
  const password_hash = await hash(password);
  const u = await authRepo.createPersonaUsuario({
    persona: { nombre, apellido, fecha_nacimiento },
    usuario: { correo_institucional: correo, password_hash, estado: 'activo' },
    // OJO: Ya no pasamos el array de roles aquí. Lo dejamos vacío.
  });

  return { id_usuario: u.id_usuario, correo: u.correo_institucional };
};

module.exports = { registerPublicUser };