const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolPermiso = sequelize.define('RolPermiso', {
    id_rol: { type: DataTypes.INTEGER, primaryKey: true },
    id_permiso: { type: DataTypes.INTEGER, primaryKey: true },
  }, {
    tableName: 'rol_permiso',
    schema: 'mantenimiento_usuarios',
    timestamps: false,
  });

  return RolPermiso;
};
