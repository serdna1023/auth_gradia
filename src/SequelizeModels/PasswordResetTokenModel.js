const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define(
    "PasswordResetToken",
    {
      id_reset_token: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "usuario",
          key: "id_usuario",
        },
      },
      token_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "password_reset_token",
      schema: "mantenimiento_usuarios",
      timestamps: true,
      updatedAt: false,
      underscored: true, 
    }
  );

  return PasswordResetToken;
};
