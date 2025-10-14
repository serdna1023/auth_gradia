const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Persona = sequelize.define(
    "Persona",
    {
      id_persona: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      apellido: { type: DataTypes.STRING(100), allowNull: false },
      fecha_nacimiento: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "persona",
      schema: "mantenimiento_usuarios",
      timestamps: true,
      underscored: true,
      paranoid: true,
    }
  );

  return Persona;
};
