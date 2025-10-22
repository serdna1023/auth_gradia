const { OAuth2Client } = require('google-auth-library');
const { signAccess } = require('../security/jwt');
const { ESTUDIANTE } = require('../../constants/roles'); 
const crypto = require('crypto');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Caso de uso para manejar el callback de Google OAuth.
 */
const googleLogin = ({ authRepo }) => async ({ code, ctx }) => {
  try {
    // 1. Intercambiar código por tokens de Google
    const { tokens } = await client.getToken(code);

    // 2. Verificar el id_token para obtener info del perfil
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload['sub'];
    const email = payload['email'];
    const nombre = payload['given_name'] || 'Usuario';
    const apellido = payload['family_name'] || 'Google';

    if (!email || !googleId) {
      throw new Error('Información de Google incompleta.');
    }

    // 3. Buscar usuario por Google ID o Email
    let user = await authRepo.findUsuarioByGoogleId(googleId);
    if (!user) {
      user = await authRepo.findUsuarioByEmail(email);
    }

    let isNewUser = false;
    if (!user) {
      // 4a. Crear nuevo usuario si no existe
      isNewUser = true;
      const defaultRoleId = await authRepo.findRolIdByName(ESTUDIANTE);
      user = await authRepo.createPersonaUsuario({
        persona: { nombre, apellido },
        usuario: {
          correo_institucional: email,
          password_hash: null,
          estado: 'ACTIVO',
          id_google: googleId,
        },
        roleIds: [defaultRoleId],
        // auditInfo: {}
      });
    } else {
      // 4b. Vincular Google ID si el usuario existía por email
      if (!user.id_google) {
        await authRepo.linkGoogleId(user.id_usuario, googleId);
        user.id_google = googleId; // Actualizar objeto local
      }
    }

    // 5. Generar tokens JWT propios
    // 👇 Usa signAccess para el accessToken (JWT firmado)
    const accessToken = signAccess({ sub: user.id_usuario, email: user.correo_institucional });
    // 👇 Genera un refreshToken aleatorio (no es JWT)
    const rawRefresh = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
    const expires_at = new Date(Date.now() + REFRESH_TTL_MS);

    await authRepo.saveRefreshToken({
      id_usuario: user.id_usuario,
      token_hash: tokenHash,
      expires_at,
      client_info: { ip: ctx?.ip, userAgent: ctx?.ua, provider: 'google' }
    });

    // Devolver resultado
    return {
      isNewUser,
      user: { id: user.id_usuario, email: user.correo_institucional },
      accessToken, 
      refreshToken: rawRefresh, 
    };

  } catch (error) {
    console.error('Error detallado durante el login con Google:', error);
    throw new Error('Fallo en la autenticación con Google.');
  }
};

/**
 * Genera la URL de autenticación de Google.
 */
const getGoogleAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

module.exports = { googleLogin, getGoogleAuthUrl };