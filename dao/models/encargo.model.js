import { DataTypes } from "sequelize";

// Tabla encargos. clienteId es la FK de la relación 1 a N con clientes (asociación en models/index.js).
export const defineEncargoModel = (sequelize) =>
  sequelize.define(
    "Encargo",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clienteId: { type: DataTypes.INTEGER, allowNull: false },
      descripcion: { type: DataTypes.STRING(500), allowNull: false },
      estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "presupuestado" },
      fechaEntregaEstimada: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: "encargos", timestamps: false }
  );

export default defineEncargoModel;
