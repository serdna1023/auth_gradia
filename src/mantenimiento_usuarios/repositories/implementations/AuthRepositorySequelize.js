const { AuthRepository } = require('../interfaces/AuthRepository');
const { sequelize, Persona, Usuario, Rol, RefreshToken } = require('../../../SequelizeModels');
const { Op } = require('sequelize');

class AuthRepositorySequelize extends AuthRepository {
  async createPersonaUsuario({ persona, usuario, roles = [] }) {
    return sequelize.transaction(async (t) => {
      const p = await Persona.create(persona, { transaction: t });
      const u = await Usuario.create({ ...usuario, id_persona: p.id_persona }, { transaction: t });

      if (roles.length) {
        const rows = await Rol.findAll({ where: { nombre_rol: { [Op.in]: roles } }, transaction: t });
        await u.addRols(rows, { transaction: t }); 
      }
      return u;
    });
  }

  findUsuarioByEmail(email) {
    return Usuario.findOne({ where: { correo_institucional: email } });
  }

  saveRefreshToken({ id_usuario, token_hash, expires_at, client_info }) {
    return RefreshToken.create({ id_usuario, token_hash, expires_at, client_info });
  }

  findValidRefreshToken(token_hash) {
    return RefreshToken.findOne({
      where: { token_hash, revoked_at: null, expires_at: { [Op.gt]: new Date() } }
    });
  }

  async revokeRefreshToken(token_hash) {
    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (row && !row.revoked_at) { row.revoked_at = new Date(); await row.save(); }
  }
}
module.exports = { AuthRepositorySequelize };
