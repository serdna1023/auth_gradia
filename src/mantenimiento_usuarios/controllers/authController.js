function mapError(err) {
  // Respeta el status si viene del use-case (e.status)
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Casos comunes de Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'EMAIL_YA_REGISTRADO';
  }
  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = err.errors?.[0]?.message || 'VALIDATION_ERROR';
  }
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON_INVÁLIDO';
  }

  return { status, message };
}

const makeAuthController = ({ registerPublicUC, adminCreateUC, loginUC, refreshUC, logoutUC, changePasswordUC, forgotPasswordUC }) => ({

  // POST /api/auth/register
  registerPublic: async (req, res) => {
    try {
      const data = await registerPublicUC(req.body);
      return res.status(201).json({
        message: 'Usuario registrado correctamente',
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
      const data = await adminCreateUC(req.body);
      return res.status(201).json({
        message: 'Usuario creado por ADMIN correctamente',
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
      const data = await loginUC({ email: req.body.email, password: req.body.password }, ctx);
      return res.status(200).json({
        message: 'Login exitoso',
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
      const data = await refreshUC({ refreshToken: req.body.refreshToken }, ctx);
      return res.status(200).json({
        message: 'Token renovado',
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
        message: 'Sesión cerrada correctamente',
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
      
      const data = await changePasswordUC({ userId, oldPassword, newPassword });
      
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

});

module.exports = { makeAuthController };
