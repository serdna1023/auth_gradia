const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// 🔑 CLAVE: Define la configuración segura para producción (HTTPS a HTTPS, Cross-Domain)
const COOKIE_BASE_OPTIONS = {
    httpOnly: true,
    // Debe ser TRUE en producción (Render) para que la cookie sea enviada por Vercel (HTTPS)
    secure: IS_PRODUCTION, 
    // 'None' es obligatorio para que la cookie viaje entre dominios (Vercel <-> Render)
    sameSite: 'None', 
    // NO INCLUIR 'domain'
};


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
  getMyProfileUC,  // 🔧 Agregado: use-case para obtener perfil del usuario
}) => ({

  // POST /api/auth/register (sin cambios)
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

  // POST /api/auth/admin/users (sin cambios)
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

      // --- 🔑 USAMOS LA CONFIGURACIÓN FINAL DE PRODUCCIÓN ---
      const accessCookieOptions = {
        ...COOKIE_BASE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutos
      };
      res.cookie('accessToken', accessToken, accessCookieOptions);

      const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
      const refreshCookieOptions = {
        ...COOKIE_BASE_OPTIONS,
        maxAge: REFRESH_TTL_MS
      };
      res.cookie('refreshToken', refreshToken, refreshCookieOptions);
      
      // Enviamos una respuesta simple (¡SIN TOKENS EN EL JSON!)
      return res.status(200).json({ message: 'Login exitoso' });

    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

// POST /api/auth/refresh
  refresh: async (req, res) => {
    try {
      const ctx = { ip: req.ip, ua: req.headers['user-agent'] };
      const oldRefreshToken = req.cookies.refreshToken;

      if (!oldRefreshToken) {
        return res.status(401).json({ message: 'NO_REFRESH_TOKEN_COOKIE' });
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshUC(
        { refreshToken: oldRefreshToken },
        ctx
      );

      // 3. ESTABLECEMOS LAS NUEVAS COOKIES
      const accessCookieOptions = {
        ...COOKIE_BASE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutos
      };
      res.cookie('accessToken', newAccessToken, accessCookieOptions); 

      const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
      const refreshCookieOptions = {
        ...COOKIE_BASE_OPTIONS,
        maxAge: REFRESH_TTL_MS
      };
      res.cookie('refreshToken', newRefreshToken, refreshCookieOptions); 
      
      return res.status(200).json({ message: 'Token renovado' });

    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },


// POST /api/auth/logout
  logout: async (req, res) => {
    try {
      const tokenDeLaCookie = req.cookies.refreshToken;
      if (tokenDeLaCookie) {
        await logoutUC({ refreshToken: tokenDeLaCookie });
      }

      // 3. LIMPIAMOS AMBAS COOKIES DEL NAVEGADOR
      // 🔑 Usamos la base de opciones para el clearCookie
      res.clearCookie('refreshToken', COOKIE_BASE_OPTIONS); 
      res.clearCookie('accessToken', COOKIE_BASE_OPTIONS);

      return res.status(200).json({
        message: "Sesión cerrada correctamente",
        data: { ok: true }
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // PUT /api/auth/password (sin cambios)
  changePassword: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { oldPassword, newPassword } = req.body;

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

  // POST /api/auth/forgot-password (sin cambios)
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

  // DELETE /api/auth/admin/users/:id (sin cambios)
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
  
    // POST /api/auth/reset-password (sin cambios)
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
      const url = getGoogleAuthUrl(); // Obtiene la URL de Google

      // 🔑 CORRECCIÓN CLAVE: Responde manualmente con 302 y fuerza los headers CORS
      // Usamos el mismo patrón para el redirect de Google
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Responde con status 302, establece el header 'Location' y termina la respuesta.
      return res.status(302).setHeader('Location', url).send(); 
      
    } catch (error) {
        console.error("Error al generar URL de Google:", error);
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

      // 4. ESTABLECER COOKIES (USANDO LA CONFIGURACIÓN FINAL)
      const accessCookieOptions = {
        ...COOKIE_BASE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutos
      };
      res.cookie('accessToken', result.accessToken, accessCookieOptions);

      const REFRESH_TTL_MS = parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10);
      const refreshCookieOptions = {
        ...COOKIE_BASE_OPTIONS,
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
      const userProfile = await getMyProfileUC(userId);  // 🔧 FIX: Pasar userId directamente, no como objeto
      return res.status(200).json({ data: userProfile });
    } catch (err) {
      console.error('Error en getMyProfile:', err);  // 🔧 Log para debugging
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

});

module.exports = { makeAuthController };