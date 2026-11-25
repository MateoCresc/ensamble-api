import { defineClienteModel } from "./cliente.model.js";
import { defineMaterialModel } from "./material.model.js";
import { defineEncargoModel } from "./encargo.model.js";
import { defineEncargoMaterialModel } from "./encargoMaterial.model.js";

// Define todos los modelos sobre una conexión y, en un único lugar, sus asociaciones
// (consigna 2.4: "definí las asociaciones de forma centralizada"; design D1 de encargos).
export const defineModels = (sequelize) => {
  const ClienteModel = defineClienteModel(sequelize);
  const MaterialModel = defineMaterialModel(sequelize);
  const EncargoModel = defineEncargoModel(sequelize);
  const EncargoMaterialModel = defineEncargoMaterialModel(sequelize);

  // Cliente (1) — (N) Encargo. RESTRICT: la base no deja borrar un cliente con encargos.
  ClienteModel.hasMany(EncargoModel, { foreignKey: "clienteId", as: "encargos", onDelete: "RESTRICT" });
  EncargoModel.belongsTo(ClienteModel, { foreignKey: "clienteId", as: "cliente", onDelete: "RESTRICT" });

  // Encargo (N) — (N) Material a través de EncargoMaterial (con la cantidad).
  // Borrar un encargo borra sus renglones (CASCADE); borrar un material usado está prohibido (RESTRICT).
  EncargoModel.belongsToMany(MaterialModel, {
    through: EncargoMaterialModel,
    foreignKey: "encargoId",
    otherKey: "materialId",
    as: "materiales",
    onDelete: "CASCADE",
  });
  MaterialModel.belongsToMany(EncargoModel, {
    through: EncargoMaterialModel,
    foreignKey: "materialId",
    otherKey: "encargoId",
    as: "encargos",
    onDelete: "RESTRICT",
  });

  return { ClienteModel, MaterialModel, EncargoModel, EncargoMaterialModel };
};

export default defineModels;
