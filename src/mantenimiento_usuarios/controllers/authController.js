// Definición de variables de entorno para la lógica de seguridad
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// 🔑 CLAVE: Determina si estamos en modo de prueba http://localhost
const ALLOW_INSECURE = process.env.ALLOW_INSECURE_COOKIES === 'true'; 

// La bandera 'secure' para la cookie: Solo es TRUE si es Producción Y NO permitimos inseguridad.
// Esto será FALSE en tu prueba de localhost a Render.
const COOKIE_SECURE_FLAG = IS_PRODUCTION && !ALLOW_INSECURE; 

// 🔑 CLAVE: Define el dominio de la cookie. Si permitimos inseguridad, el dominio es 'localhost'.
// Si no, es el dominio base de Render.
const COOKIE_DOMAIN = ALLOW_INSECURE ? 'localhost' : '.onrender.com';


function mapError(err) {
  // Respeta el status si viene del use-case (e.status)
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Error interno del servidor";

  // Casos comunes de Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    status = 409;
    message = "EMAIL_YA_REGISTRADO";
  }
  if (err.name === "SequelizeValidationError") {
    status = 400;
    message = err.errors?.[0]?.message || "VALIDATION_ERROR";
  }
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "JSON_INVÁLIDO";
  }

  return { status, message };
}

const makeAuthController = ({
  registerPublicUC,
  adminCreateUC,
  loginUC,
  refreshUC,
  logoutUC,
  changePasswordUC,
  forgotPasswordUC,
  deleteUserUC,
  resetPasswordUC,
  googleLoginUC,
  getGoogleAuthUrl,
}) => ({

  // POST /api/auth/register
  registerPublic: async (req, res) => {
    try {
      const data = await registerPublicUC(req.body);
      return res.status(201).json({
        message: "Usuario registrado correctamente",
        data,
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // POST /api/auth/admin/users
  adminCreate: async (req, res) => {
    try {
      const userData = req.body;
      const createdById = req.user.sub;
      const data = await adminCreateUC({ userData, createdById });

      return res.status(201).json({
        message: "Usuario creado por ADMIN correctamente",
        data,
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // POST /api/auth/login
  login: async (req, res) => {
    try {
      const ctx = { ip: req.ip, ua: req.headers['user-agent'] };
      const { accessToken, refreshToken } = await loginUC({ email: req.body.email, password: req.body.password }, ctx);

      // --- Configuración de Cookies Seguras ---
      const accessCookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG,
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
        maxAge: 15 * 60 * 1000 // 15 minutos
      };
      res.cookie('accessToken', accessToken, accessCookieOptions);

      const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
      const refreshCookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG,
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
        maxAge: REFRESH_TTL_MS
      };
      res.cookie('refreshToken', refreshToken, refreshCookieOptions);
      
      // Enviamos una respuesta simple de éxito, sin los tokens en el body
      return res.status(200).json({ message: 'Login exitoso' });

    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },


// POST /api/auth/refresh
  refresh: async (req, res) => {
    try {
      const ctx = { ip: req.ip, ua: req.headers['user-agent'] }; // Añadí user-agent para consistencia
      
      // 1. LEEMOS EL TOKEN DE LA COOKIE
      const oldRefreshToken = req.cookies.refreshToken;

      if (!oldRefreshToken) {
        return res.status(401).json({ message: 'NO_REFRESH_TOKEN_COOKIE' });
      }

      // 2. LLAMAMOS AL USE CASE (que devuelve { accessToken, refreshToken: raw })
      //    (Tu use case 'refreshSession' devuelve el nuevo token en 'refreshToken')
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshUC(
        { refreshToken: oldRefreshToken },
        ctx
      );

      // 3. ESTABLECEMOS LAS NUEVAS COOKIES (igual que en login)
      const accessCookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG,
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
        maxAge: 15 * 60 * 1000 // 15 minutos
      };
      res.cookie('accessToken', newAccessToken, accessCookieOptions); // El nuevo accessToken

      const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
      const refreshCookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG,
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
        maxAge: REFRESH_TTL_MS
      };
      res.cookie('refreshToken', newRefreshToken, refreshCookieOptions); // El nuevo refreshToken
      
      return res.status(200).json({ message: 'Token renovado' });

    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },


// POST /api/auth/logout
  logout: async (req, res) => {
    try {
      // 1. LEEMOS EL TOKEN DE LA COOKIE (¡NO DEL BODY!)
      const tokenDeLaCookie = req.cookies.refreshToken;

      // 2. LLAMAMOS AL USE CASE (solo si existe el token)
      if (tokenDeLaCookie) {
        await logoutUC({ refreshToken: tokenDeLaCookie });
      }

      // 3. LIMPIAMOS AMBAS COOKIES DEL NAVEGADOR
      const cookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG,
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
      };
      res.clearCookie('refreshToken', cookieOptions);
      res.clearCookie('accessToken', cookieOptions);

      // 4. RESPONDEMOS ÉXITO
      return res.status(200).json({
        message: "Sesión cerrada correctamente",
        data: { ok: true }
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // PUT /api/auth/password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { oldPassword, newPassword } = req.body;

      // Llamamos al caso de uso, pasando el ID del usuario como el que actualiza
      const data = await changePasswordUC({
        userId,
        oldPassword,
        newPassword,
        updatedById: userId,
      });

      return res.status(200).json(data);
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // POST /api/auth/forgot-password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const data = await forgotPasswordUC({ email });
      return res.status(200).json(data);
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // DELETE /api/auth/admin/users/:id
  deleteUser: async (req, res) => {
    try {
      const userIdToDelete = req.params.id;
      const adminId = req.user.sub; 

      const data = await deleteUserUC({ userIdToDelete, adminId });

      return res.status(200).json(data);
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },
  
    // POST /api/auth/reset-password
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const data = await resetPasswordUC({ token, newPassword });
      return res.status(200).json(data);
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // GET /api/auth/google
  redirectToGoogle: (req, res) => {
    try {
      const url = getGoogleAuthUrl(); // Obtiene la URL de Google desde el caso de uso
      res.redirect(url); // Envía una respuesta de redirección al navegador
    } catch (error) {
        console.error("Error al generar URL de Google:", error);
        // Idealmente, redirigir a una página de error en el frontend
        res.status(500).json({ message: 'Error al iniciar sesión con Google.' });
    }
  },

  // GET /api/auth/google/callback
  handleGoogleCallback: async (req, res) => {
    try {
      
      const code = req.query.code;
      if (!code) {
        throw new Error('No se recibió el código de Google.');
      }

      // Pasamos el código y el contexto (IP, User-Agent) al caso de uso principal
      const ctx = { ip: req.ip, ua: req.headers['user-agent'] };
      const result = await googleLoginUC({ code, ctx }); // Llama a la lógica principal

      // En lugar de enviar tokens en la URL (inseguro), establecemos cookies httpOnly
      // iguales a las que usamos en /login y /refresh, y redirigimos sin tokens.
      const accessCookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG, // 🔑 CORREGIDO
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
        maxAge: 15 * 60 * 1000 // 15 minutos
      };
      res.cookie('accessToken', result.accessToken, accessCookieOptions);

      const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
      const refreshCookieOptions = {
        httpOnly: true,
        secure: COOKIE_SECURE_FLAG, // 🔑 CORREGIDO
        sameSite: 'Lax',
        domain: COOKIE_DOMAIN, // 👈 CORREGIDO
        maxAge: REFRESH_TTL_MS
      };
      res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

      // Redirigimos al frontend sin tokens; incluimos sólo un flag no sensible
      // (isNewUser) si el frontend lo necesita para UX.
      const frontendRedirectUrl = `${process.env.FRONTEND_URL}/auth/callback?isNewUser=${result.isNewUser}`;
      // Nota: el frontend debe hacer peticiones con `credentials: 'include'`
      // para que las cookies httpOnly sean enviadas al backend.
      res.redirect(frontendRedirectUrl);

    } catch (err) {
      // Si algo falla, redirigimos al usuario a la página de login del frontend con un mensaje de error.
      const { status, message } = mapError(err);
      console.error("Error en handleGoogleCallback:", message); 
      // Mensaje genérico para el usuario en la URL
      const frontendErrorUrl = `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Fallo en la autenticación con Google.')}`;
      res.redirect(frontendErrorUrl);
    }
  },
  
  // GET /api/auth/me
  getMyProfile: async (req, res) => {
    try {
      const userId = req.user.sub;
      const userProfile = await getMyProfileUC({ userId });
      return res.status(200).json({ data: userProfile });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

});

module.exports = { makeAuthController };