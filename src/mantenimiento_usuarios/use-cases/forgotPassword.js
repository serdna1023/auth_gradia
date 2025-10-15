const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../../services/emailService');
/**
 * @param {object} dependencies 
 * @param {object} dependencies.authRepo 
 */
const forgotPassword = ({ authRepo }) => async ({ email }) => {
  // 1. Buscamos al usuario por su correo electrónico.
  const user = await authRepo.findUsuarioByEmail(email);

  // 2. ¡Paso de seguridad crucial! Si el usuario no existe, no hacemos nada
  // y terminamos el proceso en silencio. Esto evita que los atacantes
  // puedan adivinar qué correos están registrados en el sistema.
  if (!user) {
    console.log(`Solicitud de reseteo para un correo no existente: ${email}`);
    return { message: 'Si tu correo está registrado, recibirás un enlace de recuperación.' };
  }

  // 3. Generamos un token seguro y de un solo uso.
  const tokenOriginal = crypto.randomBytes(32).toString('hex');

  // 4. Creamos el HASH del token para guardarlo en la base de datos.
  const tokenHash = crypto.createHash('sha256').update(tokenOriginal).digest('hex');

  // 5. Definimos la fecha de expiración (ej. 15 minutos desde ahora).
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // 6. Guardamos el token hasheado en la base de datos.
  await authRepo.savePasswordResetToken(user.id_usuario, tokenHash, expiresAt);

  // 7. Enviamos el correo con el token ORIGINAL.
  await sendPasswordResetEmail(user.correo_institucional, tokenOriginal);

  return { message: 'Si tu correo está registrado, recibirás un enlace de recuperación.' };
};

module.exports = { forgotPassword };