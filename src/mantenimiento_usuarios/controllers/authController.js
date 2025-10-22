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
      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const data = await loginUC(
        { email: req.body.email, password: req.body.password },
        ctx
      );
      return res.status(200).json({
        message: "Login exitoso",
        data,
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // POST /api/auth/refresh
  refresh: async (req, res) => {
    try {
      const ctx = { ip: req.ip };
      const data = await refreshUC(
        { refreshToken: req.body.refreshToken },
        ctx
      );
      return res.status(200).json({
        message: "Token renovado",
        data,
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // POST /api/auth/logout
  logout: async (req, res) => {
    try {
      const data = await logoutUC({ refreshToken: req.body.refreshToken });
      return res.status(200).json({
        message: "Sesión cerrada correctamente",
        data,
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

      // Redirigimos al usuario al frontend, pasándole los tokens de NUESTRA app.
      // Estrategia simple: usar parámetros de URL. Considera cookies HttpOnly para producción.
      const frontendRedirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&isNewUser=${result.isNewUser}`;
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

});

module.exports = { makeAuthController };
