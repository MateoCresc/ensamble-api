import { DataTypes } from "sequelize";

// Tabla materiales. nombreNormalizado (trim + minúsculas) lleva el índice único (design D5)
// y no se expone en las respuestas. Las cantidades admiten 2 decimales (design D4).
export const defineMaterialModel = (sequelize) =>
  sequelize.define(
    "Material",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      nombreNormalizado: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      unidad: { type: DataTypes.STRING(10), allowNull: false },
      stock: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      stockMinimo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    },
    { tableName: "materiales", timestamps: false }
  );

export default defineMaterialModel;
