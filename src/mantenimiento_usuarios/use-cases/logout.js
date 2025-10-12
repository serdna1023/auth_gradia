const crypto = require('crypto');

const logout = ({ authRepo }) => async ({ refreshToken }) => {
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await authRepo.revokeRefreshToken(hash);
  return { ok: true };
};
module.exports = { logout };
