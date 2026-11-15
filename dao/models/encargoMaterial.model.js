import { DataTypes } from "sequelize";

// Tabla intermedia de la relación N a N entre encargos y materiales. Además de las dos claves
// guarda un dato propio de la relación: la cantidad de ese material que usa el encargo.
export const defineEncargoMaterialModel = (sequelize) =>
  sequelize.define(
    "EncargoMaterial",
    {
      encargoId: { type: DataTypes.INTEGER, primaryKey: true },
      materialId: { type: DataTypes.INTEGER, primaryKey: true },
      cantidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    { tableName: "encargo_materiales", timestamps: false }
  );

export default defineEncargoMaterialModel;
