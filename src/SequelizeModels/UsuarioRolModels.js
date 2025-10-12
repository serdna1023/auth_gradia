const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioRol = sequelize.define('UsuarioRol', {
    id_usuario_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    id_rol: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'usuario_rol',
    schema: 'mantenimiento_usuarios',
    timestamps: true,
    underscored: true,
    paranoid: true,
  });

  return UsuarioRol;
};
