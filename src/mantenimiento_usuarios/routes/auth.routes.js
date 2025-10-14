const express = require('express');

// Wrapper para manejar errores async sin try/catch en cada handler
const asyncH = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function buildAuthRouter({ repos }) {
  if (!repos?.AuthRepository) {
    throw new Error('AuthRepository dependency missing in buildAuthRouter');
  }

  // Use-cases y controller
  const { registerPublicUser } = require('../use-cases/registerPublicUser');
  const { adminCreateUser }    = require('../use-cases/adminCreateUser');
  const { loginUser }          = require('../use-cases/loginUser');
  const { refreshSession }     = require('../use-cases/refreshSession');
  const { changePassword }     = require('../use-cases/changePassword');
  const { logout }             = require('../use-cases/logout');
  const { forgotPassword } = require('../use-cases/forgotPassword'); 
  const { makeAuthController } = require('../controllers/authController');

  // Seguridad
  const authenticate = require('../security/authenticate');
  const authorize    = require('../security/authorize');
  const { ADMIN }    = require('../../constants/roles');

  // Inyección de dependencias a los casos de uso
  const registerPublicUC = registerPublicUser({ authRepo: repos.AuthRepository });
  const adminCreateUC    = adminCreateUser({ authRepo: repos.AuthRepository });
  const loginUC          = loginUser({ authRepo: repos.AuthRepository });
  const refreshUC        = refreshSession({ authRepo: repos.AuthRepository });
  const logoutUC         = logout({ authRepo: repos.AuthRepository });
  const changePasswordUC = changePassword({ authRepo: repos.AuthRepository });
  const forgotPasswordUC = forgotPassword({ authRepo: repos.AuthRepository }); 



  // Controller
  const ctrl = makeAuthController({
    registerPublicUC,
    adminCreateUC,
    loginUC,
    refreshUC,
    logoutUC,
    changePasswordUC,
    forgotPasswordUC,
  });

  // Router de Express
  const router = express.Router();

  /* ------- Rutas públicas ------- */
  router.post('/register', asyncH(ctrl.registerPublic));
  router.post('/login',    asyncH(ctrl.login));
  router.post('/refresh',  asyncH(ctrl.refresh));
  router.post('/logout', asyncH(ctrl.logout)); 
  router.post('/forgot-password', asyncH(ctrl.forgotPassword)); 

  /* ------- Rutas protegidas ------- */
  router.post('/admin/users',   authenticate, authorize(ADMIN),        asyncH(ctrl.adminCreate));
  router.put('/password', authenticate, asyncH(ctrl.changePassword)); 

  /* ------- Health local opcional ------- */
  router.get('/_ready', (_req, res) => res.json({ ok: true }));

  return router;
}

module.exports = { buildAuthRouter };

