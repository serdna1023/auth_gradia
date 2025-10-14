const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rol = sequelize.define('Rol', {
    id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_rol: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    estado: { type: DataTypes.STRING(20), defaultValue: 'activo' },
  }, {
    tableName: 'rol',
    schema: 'mantenimiento_usuarios',
    timestamps: false,
  });

  return Rol;
};                      