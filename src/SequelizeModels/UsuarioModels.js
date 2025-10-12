const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    correo_institucional: { type: DataTypes.STRING(150), unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    estado: { type: DataTypes.ENUM('ACTIVO','INACTIVO'), defaultValue: 'ACTIVO' },
    id_persona: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },

  }, {
    tableName: 'usuario',
    schema: 'mantenimiento_usuarios',
    timestamps: true,
    underscored: true,
    paranoid: true,
  });

  return Usuario;
};
