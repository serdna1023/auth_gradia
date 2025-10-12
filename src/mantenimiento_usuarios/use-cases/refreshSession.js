const crypto = require('crypto');
const { signAccess } = require('../security/jwt');

const REFRESH_TTL_MS = +process.env.JWT_REFRESH_TTL_MS || 1000*60*60*24*7;

const refreshSession = ({ authRepo }) => async ({ refreshToken }, ctx = {}) => {
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const row = await authRepo.findValidRefreshToken(hash);
  if (!row) { const e = new Error('REFRESH_INVALIDO'); e.status = 401; throw e; }

  // rotación
  await authRepo.revokeRefreshToken(hash);
  const accessToken = signAccess({ sub: row.id_usuario });

  const raw = crypto.randomBytes(32).toString('hex');
  const new_hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expires_at = new Date(Date.now() + REFRESH_TTL_MS);
  await authRepo.saveRefreshToken({ id_usuario: row.id_usuario, token_hash: new_hash, expires_at, client_info: { ip: ctx.ip } });

  return { accessToken, refreshToken: raw };
};
module.exports = { refreshSession };
