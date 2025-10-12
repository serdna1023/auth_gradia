const crypto = require('crypto');
const { compare } = require('../security/password');
const { signAccess } = require('../security/jwt');

const REFRESH_TTL_MS = +process.env.JWT_REFRESH_TTL_MS || 1000*60*60*24*7;

const loginUser = ({ authRepo }) => async ({ email, password }, ctx = {}) => {
  const user = await authRepo.findUsuarioByEmail(email);
  if (!user) { const e = new Error('CREDENCIALES_INVALIDAS'); e.status = 401; throw e; }
  const ok = await compare(password, user.password_hash);
  if (!ok) { const e = new Error('CREDENCIALES_INVALIDAS'); e.status = 401; throw e; }

  const accessToken = signAccess({ sub: user.id_usuario, email: user.correo_institucional });

  const rawRefresh = crypto.randomBytes(32).toString('hex');
  const token_hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
  const expires_at = new Date(Date.now() + REFRESH_TTL_MS);

  await authRepo.saveRefreshToken({
    id_usuario: user.id_usuario, token_hash, expires_at,
    client_info: { ip: ctx.ip, userAgent: ctx.ua }
  });

  return { accessToken, refreshToken: rawRefresh };
};
module.exports = { loginUser };
