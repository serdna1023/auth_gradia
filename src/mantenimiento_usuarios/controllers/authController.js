const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * 🔑 CONFIGURACIÓN DE COOKIES:
 * - Local (HTTP ↔ HTTP):
 *      secure = false
 *      sameSite = "Lax"
 * - Producción (HTTPS ↔ HTTPS):
 *      secure = true
 *      sameSite = "None"
 */
const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? "None" : "Lax",
  // ❗ No incluir "domain" para evitar romper las cookies cross-domain
};

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

  // ----------------------
  // REGISTER
  // ----------------------
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

  // ----------------------
  // ADMIN CREATE
  // ----------------------
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

  // ----------------------
  // LOGIN
  // ----------------------
  login: async (req, res) => {
    try {
      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const { accessToken, refreshToken } = await loginUC(
        {
          email: req.body.email,
          password: req.body.password,
        },
        ctx
      );

      res.cookie("accessToken", accessToken, {
        ...COOKIE_BASE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 min
      });

      const REFRESH_TTL_MS = parseInt(
        process.env.JWT_REFRESH_TTL_MS || "604800000",
        10
      );

      res.cookie("refreshToken", refreshToken, {
        ...COOKIE_BASE_OPTIONS,
        maxAge: REFRESH_TTL_MS,
      });

      return res.status(200).json({ message: "Login exitoso" });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ----------------------
  // REFRESH TOKEN
  // ----------------------
  refresh: async (req, res) => {
    try {
      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const oldRefreshToken = req.cookies.refreshToken;

      if (!oldRefreshToken) {
        return res.status(401).json({ message: "NO_REFRESH_TOKEN_COOKIE" });
      }

      const {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      } = await refreshUC({ refreshToken: oldRefreshToken }, ctx);

      res.cookie("accessToken", newAccessToken, {
        ...COOKIE_BASE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      const REFRESH_TTL_MS = parseInt(
        process.env.JWT_REFRESH_TTL_MS || "604800000",
        10
      );

      res.cookie("refreshToken", newRefreshToken, {
        ...COOKIE_BASE_OPTIONS,
        maxAge: REFRESH_TTL_MS,
      });

      return res.status(200).json({ message: "Token renovado" });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ----------------------
  // LOGOUT
  // ----------------------
  logout: async (req, res) => {
    try {
      const refreshCookie = req.cookies.refreshToken;

      if (refreshCookie) {
        await logoutUC({ refreshToken: refreshCookie });
      }

      res.clearCookie("refreshToken", COOKIE_BASE_OPTIONS);
      res.clearCookie("accessToken", COOKIE_BASE_OPTIONS);

      return res.status(200).json({
        message: "Sesión cerrada correctamente",
        data: { ok: true },
      });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },

  // ----------------------
  // CHANGE PASSWORD
  // ----------------------
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

  // ----------------------
  // FORGOT PASSWORD
  // ----------------------
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

  // ----------------------
  // DELETE USER
  // ----------------------
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

  // ----------------------
  // RESET PASSWORD
  // ----------------------
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

  // ----------------------
  // GOOGLE REDIRECT
  // ----------------------
  redirectToGoogle: (req, res) => {
    try {
      const url = getGoogleAuthUrl();

      res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
      res.setHeader("Access-Control-Allow-Credentials", "true");

      return res.status(302).setHeader("Location", url).send();
    } catch (error) {
      console.error("Error al generar URL de Google:", error);
      res.status(500).json({ message: "Error al iniciar sesión con Google." });
    }
  },

  // ----------------------
  // GOOGLE CALLBACK
  // ----------------------
  handleGoogleCallback: async (req, res) => {
    try {
      const code = req.query.code;
      if (!code) throw new Error("No se recibió el código de Google.");

      const ctx = { ip: req.ip, ua: req.headers["user-agent"] };
      const result = await googleLoginUC({ code, ctx });

      res.cookie("accessToken", result.accessToken, {
        ...COOKIE_BASE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      const REFRESH_TTL_MS = parseInt(
        process.env.JWT_REFRESH_TTL_MS || "604800000",
        10
      );

      res.cookie("refreshToken", result.refreshToken, {
        ...COOKIE_BASE_OPTIONS,
        maxAge: REFRESH_TTL_MS,
      });

      const redirect = `${process.env.FRONTEND_URL}/auth/callback?isNewUser=${result.isNewUser}`;
      return res.redirect(redirect);
    } catch (err) {
      const frontendErrorUrl = `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
        "Fallo en la autenticación con Google."
      )}`;
      return res.redirect(frontendErrorUrl);
    }
  },

  // ----------------------
  // PROFILE
  // ----------------------
  getMyProfile: async (req, res) => {
    try {
      const userId = req.user.sub;
      const profile = await getMyProfileUC(userId);

      return res.status(200).json({ data: profile });
    } catch (err) {
      const { status, message } = mapError(err);
      return res.status(status).json({ message });
    }
  },
});

module.exports = { makeAuthController };