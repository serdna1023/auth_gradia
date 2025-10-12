const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id_token: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: { type: DataTypes.TEXT, allowNull: false },
    issued_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    client_info: { type: DataTypes.JSONB, allowNull: true },

    // Auditoría
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'refresh_token',
    schema: 'mantenimiento_usuarios',
    timestamps: true,   
    underscored: true,  
    paranoid: true,     // activa deleted_at para soft delete
  });

  return RefreshToken;
};
