const crypto = require('crypto');
const { hash } = require('../security/password');
const { sendPasswordChangeConfirmationEmail } = require('../../services/emailService');

/**
 * @param {object} dependencies 
 * @param {object} dependencies.authRepo
 */
const resetPassword = ({ authRepo }) => async ({ token, newPassword }) => {

  if (!token || !newPassword) {
    const err = new Error('Se requieren el token y la nueva contraseña.');
    err.status = 400;
    throw err;
  }
  if (newPassword.length < 8) { 
    const err = new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    err.status = 400;
    throw err;
  }

  // 2. Hasheamos el token que nos llega para buscarlo en la BD.
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // 3. Buscamos si existe un token válido y que no haya expirado.
  const resetToken = await authRepo.findValidPasswordResetToken(tokenHash);
  if (!resetToken) {
    const err = new Error('El token es inválido o ha expirado.');
    err.status = 400;
    throw err;
  }

  // 4. Hasheamos la nueva contraseña.
  const newPasswordHash = await hash(newPassword);
  const userId = resetToken.id_usuario;
  
  // 5. Actualizamos la contraseña del usuario, registrando que él mismo hizo el cambio.
  await authRepo.updateUserPassword(userId, newPasswordHash, userId); 
  await authRepo.deletePasswordResetToken(tokenHash);
  sendPasswordChangeConfirmationEmail(resetToken.Usuario.correo_institucional);

  return { message: 'Tu contraseña ha sido actualizada correctamente.' };
};

module.exports = { resetPassword };