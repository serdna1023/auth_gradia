const { compare, hash } = require('../security/password');

const changePassword = ({ authRepo }) => async ({ userId, oldPassword, newPassword, updatedById}) => {
  // 1. Validaciones básicas
  if (!oldPassword || !newPassword) {
    const err = new Error('Se requieren la contraseña antigua y la nueva.');
    err.status = 400;
    throw err;
  }
  
  if (newPassword.length < 8) { 
    const err = new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    err.status = 400;
    throw err;
  }

  // 2. Buscar al usuario por su ID
  const user = await authRepo.findUsuarioById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }

  // 3. Verificar la contraseña antigua
  const isMatch = await compare(oldPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('La contraseña antigua es incorrecta.');
    err.status = 403;
    throw err;
  }

  const newPasswordHash = await hash(newPassword);
  await authRepo.updateUserPassword(userId, newPasswordHash), updatedById;

  return { message: 'Contraseña actualizada correctamente.' };
};

module.exports = { changePassword };