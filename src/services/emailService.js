const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * @param {string} toEmail 
 * @param {string} token
 */
const sendPasswordResetEmail = async (toEmail, token) => {

const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
const resetLink = `${frontendURL}/auth/reset-password?token=${token}`;

  const msg = {
    to: toEmail, 
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Restablecimiento de tu contraseña',
    html: `
      <h1>¿Olvidaste tu contraseña?</h1>
      <p>No te preocupes. Haz clic en el siguiente enlace para restablecerla. Este enlace es válido por 15 minutos.</p>
      <a href="${resetLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `,
  };

  try {

    await sgMail.send(msg);
    console.log(`Correo de reseteo enviado a ${toEmail} a través de SendGrid.`);
  } catch (error) {
    console.error('Error al enviar el correo con SendGrid:', error);

    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('No se pudo enviar el correo de restablecimiento.');
  }
};

const sendPasswordChangeConfirmationEmail = async (toEmail) => {
  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Confirmación de cambio de contraseña',
    html: `
      <h1>Tu contraseña ha sido actualizada</h1>
      <p>Te confirmamos que la contraseña de tu cuenta ha sido cambiada exitosamente.</p>
      <p>Si no has sido tú quien realizó este cambio, por favor, contacta con nuestro equipo de soporte inmediatamente.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Correo de confirmación de cambio de contraseña enviado a ${toEmail}.`);
  } catch (error) {
    console.error('Error al enviar el correo de confirmación:', error);
  }
};

module.exports = { sendPasswordResetEmail, sendPasswordChangeConfirmationEmail };