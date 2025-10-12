const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permiso = sequelize.define('Permiso', {
    id_permiso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_permiso: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    descripcion_permiso: { type: DataTypes.TEXT },
  }, {
    tableName: 'permiso',
    schema: 'mantenimiento_usuarios',
    timestamps: false,
  });

  return Permiso;
};
