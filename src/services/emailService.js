const sgMail = require('@sendgrid/mail');

// Aquí es donde el código busca la "llave" para hablar con SendGrid.
// La buscará en tu archivo .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Envía un correo electrónico para el restablecimiento de contraseña usando SendGrid.
 * @param {string} toEmail - La dirección de correo del destinatario.
 * @param {string} token - El token de un solo uso para el enlace.
 */
const sendPasswordResetEmail = async (toEmail, token) => {
  // Este es el enlace que el usuario recibirá.
  // Asumimos que tu frontend (la parte visual) correrá en localhost:3000
  // y tendrá una página específica para manejar el reseteo.
  const resetLink = `http://localhost:8080/reset-password?token=${token}`;

  // Este es el formato de mensaje que SendGrid necesita.
  const msg = {
    to: toEmail, // El correo del usuario que olvidó su contraseña
    from: process.env.SENDGRID_FROM_EMAIL, // El correo que verificaste en tu cuenta de SendGrid
    subject: 'Restablecimiento de tu contraseña',
    html: `
      <h1>¿Olvidaste tu contraseña?</h1>
      <p>No te preocupes. Haz clic en el siguiente enlace para restablecerla. Este enlace es válido por 15 minutos.</p>
      <a href="${resetLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `,
  };

  try {
    // Le decimos a SendGrid que envíe el mensaje
    await sgMail.send(msg);
    console.log(`Correo de reseteo enviado a ${toEmail} a través de SendGrid.`);
  } catch (error) {
    console.error('Error al enviar el correo con SendGrid:', error);
    // Si SendGrid nos da más detalles del error, los mostramos en la consola
    if (error.response) {
      console.error(error.response.body);
    }
    // Lanzamos un error genérico para que el caso de uso sepa que algo falló
    throw new Error('No se pudo enviar el correo de restablecimiento.');
  }
};

module.exports = { sendPasswordResetEmail };