const sequelize = require('../config/database');

// Importar definiciones
const Usuario = require('./UsuarioModels')(sequelize);
const Rol = require('./RolModels')(sequelize);
const Permiso = require('./PermisoModels')(sequelize);
const Persona = require('./PersonaModels')(sequelize);
const UsuarioRol = require('./UsuarioRolModels')(sequelize);
const RolPermiso = require('./RolPermisoModels')(sequelize);
const RefreshToken = require('./RefreshTokenModels')(sequelize);
const LogAuditoria = require('./LogAuditoriaModels')(sequelize);
const PasswordResetToken = require('./PasswordResetTokenModel')(sequelize);

// Relaciones
Usuario.belongsTo(Persona, { foreignKey: 'id_persona' });
Persona.hasOne(Usuario, { foreignKey: 'id_persona' });

Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: 'id_usuario', otherKey: 'id_rol' });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: 'id_rol', otherKey: 'id_usuario' });

Rol.belongsToMany(Permiso, { through: RolPermiso, foreignKey: 'id_rol', otherKey: 'id_permiso' });
Permiso.belongsToMany(Rol, { through: RolPermiso, foreignKey: 'id_permiso', otherKey: 'id_rol' });

Usuario.hasMany(RefreshToken, { foreignKey: 'id_usuario' });
RefreshToken.belongsTo(Usuario, { foreignKey: 'id_usuario' });

Usuario.hasMany(LogAuditoria, { foreignKey: 'id_usuario' });
LogAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });

Usuario.hasMany(PasswordResetToken, { foreignKey: 'id_usuario' });
PasswordResetToken.belongsTo(Usuario, { foreignKey: 'id_usuario' });

module.exports = {
  sequelize,
  Persona,
  Usuario,
  Rol,
  Permiso,
  UsuarioRol,
  RolPermiso,
  RefreshToken,
  LogAuditoria,
  PasswordResetToken,
};
