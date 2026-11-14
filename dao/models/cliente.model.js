import { DataTypes } from "sequelize";

// Tabla clientes. El email es único también en la base (respaldo de la regla del caso de uso).
export const defineClienteModel = (sequelize) =>
  sequelize.define(
    "Cliente",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
      telefono: { type: DataTypes.STRING(20), allowNull: true },
    },
    { tableName: "clientes", timestamps: false }
  );

export default defineClienteModel;
