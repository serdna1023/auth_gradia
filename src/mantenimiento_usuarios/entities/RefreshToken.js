class RefreshToken {
  constructor({ id = null, id_usuario, token_hash, issued_at = new Date(), expires_at, revoked_at = null, client_info = null }) {
    if (!id_usuario) throw error('USER_ID_REQUERIDO', 400);
    if (!token_hash || token_hash.length < 40) throw error('TOKEN_HASH_INVALIDO', 400);
    if (!expires_at || isNaN(Date.parse(expires_at))) throw error('EXPIRACION_INVALIDA', 400);
    const exp = new Date(expires_at);
    if (exp <= new Date()) throw error('EXPIRACION_EN_EL_PASADO', 400);

    this.id = id;
    this.id_usuario = id_usuario;
    this.token_hash = token_hash;
    this.issued_at = new Date(issued_at);
    this.expires_at = exp;
    this.revoked_at = revoked_at ? new Date(revoked_at) : null;
    this.client_info = client_info || null;
  }

  isActive() {
    return !this.revoked_at && this.expires_at > new Date();
  }
}
function error(message, status) { const e = new Error(message); e.status = status; return e; }
module.exports = { RefreshToken };
