function mapError(err) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Error interno del servidor";
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

// ======================================================
//  CONFIGURACIÓN AUTOMÁTICA DE COOKIES (LOCAL / PROD)
// ======================================================
const isLocalhost = process.env.NODE_ENV !== 'production';

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: !isLocalhost,
  sameSite: isLocalhost ? 'Lax' : 'None',
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_BASE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 min
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_BASE_OPTIONS,
  maxAge: parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10),
};

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
  getMyProfileUC,
}) => ({

  // ======================================================
  //  REGISTER (PUBLIC)
  // ======================================================
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

  // ======================================================
  //  ADMIN CREATE USER
  // ======================================================
  adminCreate: async (req, res) => {
    try {
      const userData = req.body;
      const createdById = req.user.sub;
      const data = await adminCreateUC({ userData, createdById });
      return res.status(201).json({
        message: "Usuario creado correctamente por ADMIN",
        data,
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ======================================================
  //  LOGIN
  // ======================================================
  login: async (req, res) => {
    try {
      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const { accessToken, refreshToken } = await loginUC(
        { email: req.body.email, password: req.body.password },
        ctx
      );

      res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
      res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

      return res.status(200).json({ message: "Login exitoso" });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ======================================================
  //  REFRESH TOKENS
  // ======================================================
  refresh: async (req, res) => {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      if (!oldRefreshToken) {
        return res.status(401).json({ message: "NO_REFRESH_TOKEN_COOKIE" });
      }

      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const { accessToken: newAcc, refreshToken: newRef } = await refreshUC(
        { refreshToken: oldRefreshToken },
        ctx
      );

      res.cookie("accessToken", newAcc, ACCESS_COOKIE_OPTIONS);
      res.cookie("refreshToken", newRef, REFRESH_COOKIE_OPTIONS);

      return res.status(200).json({ message: "Token renovado" });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ======================================================
  //  LOGOUT
  // ======================================================
  logout: async (req, res) => {
    try {
      const token = req.cookies.refreshToken;
      if (token) await logoutUC({ refreshToken: token });

      res.clearCookie("accessToken", COOKIE_BASE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_BASE_OPTIONS);

      return res.status(200).json({
        message: "Sesión cerrada correctamente",
        data: { ok: true },
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ======================================================
  //  FORGOT PASSWORD (¡EL QUE FALTABA!)
  // ======================================================
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

  // ======================================================
  //  RESET PASSWORD (¡TAMBIÉN FALTABA!)
  // ======================================================
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

  // ======================================================
  //  CHANGE PASSWORD (¡TAMBIÉN FALTABA!)
  // ======================================================
  changePassword: async (req, res) => {
    try {
      const userId = req.user.sub; // Viene del token
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

  // ======================================================
  //  DELETE USER (¡TAMBIÉN FALTABA!)
  // ======================================================
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

  // ======================================================
  //  REDIRECT A GOOGLE
  // ======================================================
  redirectToGoogle: (req, res) => {
    try {
      const url = getGoogleAuthUrl();
      res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      return res.status(302).setHeader("Location", url).send();
    } catch (err) {
      console.error("Error al generar URL de Google:", err);
      res.status(500).json({ message: "Error al iniciar sesión con Google." });
    }
  },

  // ======================================================
  //  GOOGLE CALLBACK
  // ======================================================
  handleGoogleCallback: async (req, res) => {
    try {
      const code = req.query.code;
      if (!code) throw new Error("No se recibió el código de Google.");

      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const result = await googleLoginUC({ code, ctx });

      res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

      const redirect = `${process.env.FRONTEND_URL}/auth/callback?isNewUser=${result.isNewUser}`;
      return res.redirect(redirect);
    } catch (err) {
      console.error("Error en handleGoogleCallback:", err);
      const errorUrl = `${process.env.FRONTEND_URL}/login?error=OAuth`;
      return res.redirect(errorUrl);
    }
  },

  // ======================================================
  //  GET PROFILE
  // ======================================================
  getMyProfile: async (req, res) => {
    try {
      const userId = req.user.sub;
      const data = await getMyProfileUC(userId);
      return res.status(200).json({ data });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },
});

module.exports = { makeAuthController };