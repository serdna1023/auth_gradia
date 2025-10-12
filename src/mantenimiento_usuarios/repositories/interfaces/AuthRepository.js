class AuthRepository {
  async createPersonaUsuario({ persona, usuario, roles }) { throw new Error('NOT_IMPLEMENTED'); }
  async findUsuarioByEmail(email) { throw new Error('NOT_IMPLEMENTED'); }

  async saveRefreshToken({ id_usuario, token_hash, expires_at, client_info }) { throw new Error('NOT_IMPLEMENTED'); }
  async findValidRefreshToken(token_hash) { throw new Error('NOT_IMPLEMENTED'); }
  async revokeRefreshToken(token_hash) { throw new Error('NOT_IMPLEMENTED'); }
}
module.exports = { AuthRepository };
