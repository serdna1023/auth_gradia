const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LogAuditoria = sequelize.define('LogAuditoria', {
    id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    fecha_evento: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    tipo_evento: { type: DataTypes.STRING(50) },
    ip_direccion: { type: DataTypes.STRING(45) },
    descripcion_evento: { type: DataTypes.TEXT },
  }, {
    tableName: 'log_auditoria',
    schema: 'mantenimiento_usuarios',
    timestamps: false,
  });

  return LogAuditoria;
};
