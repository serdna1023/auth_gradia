const { AuthRepository } = require("../interfaces/AuthRepository");
const {
  sequelize,
  Persona,
  Usuario,
  Rol,
  RefreshToken,
  PasswordResetToken,
} = require("../../../SequelizeModels");
const { Op } = require("sequelize");
const {
  ALLOWED_PUBLIC_ROLE,
  ALLOWED_ADMIN_ROLES,
} = require("../../../constants/roles");

class AuthRepositorySequelize extends AuthRepository {
  async createPersonaUsuario({
    persona,
    usuario,
    roleIds = [],
    auditInfo = {},
  }) {
    return sequelize.transaction(async (t) => {
      // 1. Inyectamos el `created_by` al momento de crear la Persona
      const p = await Persona.create(
        { ...persona, created_by: auditInfo.createdBy },
        { transaction: t }
      );

      // 2. Y también al momento de crear el Usuario
      const u = await Usuario.create(
        {
          ...usuario,
          id_persona: p.id_persona,
          created_by: auditInfo.createdBy,
        },
        { transaction: t }
      );

      let rolesParaAsignar = [];

      if (roleIds.length > 0) {
        // --- LÓGICA PARA EL ADMIN ---
        const rolesEncontrados = await Rol.findAll({
          where: { id_rol: { [Op.in]: roleIds } },
          transaction: t,
        });

        if (rolesEncontrados.length !== roleIds.length) {
          throw new Error("Uno o más de los roles especificados no existen.");
        }

        // --- ¡AQUÍ ESTÁ LA NUEVA VALIDACIÓN DE NEGOCIO! ---
        // Asumimos que el admin solo puede crear un rol a la vez por ahora.
        const nombreRol = rolesEncontrados[0].nombre_rol;
        if (!ALLOWED_ADMIN_ROLES.includes(nombreRol)) {
          const err = new Error(
            `El rol '${nombreRol}' no puede ser asignado por un administrador.`
          );
          err.status = 403; // 403 Forbidden es el código perfecto para esto.
          throw err;
        }

        rolesParaAsignar = rolesEncontrados;
      } else {
        // --- LÓGICA NUEVA PARA EL REGISTRO PÚBLICO ---
        // Si no vienen roleIds, es un usuario público. Buscamos el rol por defecto en la BD.
        console.log(`Buscando rol por defecto: ${ALLOWED_PUBLIC_ROLE}`); // Un log para depurar
        const rolPublico = await Rol.findOne({
          where: { nombre_rol: ALLOWED_PUBLIC_ROLE }, // Usa la constante para buscar el nombre
          transaction: t,
        });

        if (!rolPublico) {
          // Esto es un error crítico de configuración del sistema.
          throw new Error(
            "Error de configuración: El rol público por defecto no se encuentra en la base de datos."
          );
        }

        rolesParaAsignar = [rolPublico];
      }

      // Finalmente, asignamos los roles que correspondan (sea del admin o público)
      if (rolesParaAsignar.length > 0) {
        await u.addRols(rolesParaAsignar, { transaction: t });
      }

      return u;
    });
  }

  findUsuarioByEmail(email) {
    return Usuario.findOne({ where: { correo_institucional: email } });
  }

  saveRefreshToken({ id_usuario, token_hash, expires_at, client_info }) {
    return RefreshToken.create({
      id_usuario,
      token_hash,
      expires_at,
      client_info,
    });
  }

  findValidRefreshToken(token_hash) {
    return RefreshToken.findOne({
      where: {
        token_hash,
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });
  }

  async revokeRefreshToken(token_hash) {
    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (row && !row.revoked_at) {
      row.revoked_at = new Date();
      await row.save();
    }
  }

  findUsuarioById(id) {
    return Usuario.findByPk(id);
  }

  async updateUserPassword(userId, newPasswordHash, updatedById) {
    await Usuario.update(
      { password_hash: newPasswordHash, updated_by: updatedById },
      { where: { id_usuario: userId } }
    );
  }

  async savePasswordResetToken(userId, tokenHash, expiresAt) {
    await PasswordResetToken.create({
      id_usuario: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  }

  findValidPasswordResetToken(tokenHash) {
    return PasswordResetToken.findOne({
      where: {
        token_hash: tokenHash,
        expires_at: { [Op.gt]: new Date() }, // Op.gt significa "greater than" (mayor que)
      },
      include: Usuario,
    });
  }

  deletePasswordResetToken(tokenHash) {
    return PasswordResetToken.destroy({
      where: {
        token_hash: tokenHash,
      },
    });
  }
}
module.exports = { AuthRepositorySequelize };
