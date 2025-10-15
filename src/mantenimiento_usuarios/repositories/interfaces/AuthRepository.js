class AuthRepository {
  async createPersonaUsuario({ persona, usuario, roles }) { throw new Error('NOT_IMPLEMENTED'); }
  async findUsuarioByEmail(email) { throw new Error('NOT_IMPLEMENTED'); }
  async saveRefreshToken({ id_usuario, token_hash, expires_at, client_info }) { throw new Error('NOT_IMPLEMENTED'); }
  async findValidRefreshToken(token_hash) { throw new Error('NOT_IMPLEMENTED'); }
  async revokeRefreshToken(token_hash) { throw new Error('NOT_IMPLEMENTED'); }
  async findUsuarioById(id) { throw new Error('NOT_IMPLEMENTED'); }
  async updateUserPassword(userId, newPasswordHash) { throw new Error('NOT_IMPLEMENTED'); }
  async savePasswordResetToken(userId, tokenHash, expiresAt) { throw new Error('NOT_IMPLEMENTED'); }
  async findValidPasswordResetToken(tokenHash) { throw new Error('NOT_IMPLEMENTED'); }
  async deletePasswordResetToken(tokenHash) { throw new Error('NOT_IMPLEMENTED'); }

}
module.exports = { AuthRepository };
                                                                                                                                                                                                                                                                                          