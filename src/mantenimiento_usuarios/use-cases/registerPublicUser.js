const { hash } = require('../security/password');

const registerPublicUser = ({ authRepo }) => async ({ nombre, apellido, fecha_nacimiento, correo, password }) => {
  
  if (!password || password.length < 8) {
    const err = new Error('La contraseña debe tener al menos 8 caracteres.');
    err.status = 400;
    throw err;
  }
  
  const password_hash = await hash(password);
  const u = await authRepo.createPersonaUsuario({
    persona: { nombre, apellido, fecha_nacimiento },
    usuario: { correo_institucional: correo, password_hash, estado: 'activo' },
  });

  return { id_usuario: u.id_usuario, correo: u.correo_institucional };
};

module.exports = { registerPublicUser };