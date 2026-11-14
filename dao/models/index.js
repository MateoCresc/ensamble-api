import { defineClienteModel } from "./cliente.model.js";
import { defineMaterialModel } from "./material.model.js";

// Define todos los modelos sobre una conexión y, en un único lugar, sus asociaciones
// (consigna 2.4: "definí las asociaciones de forma centralizada").
// Las asociaciones de encargos (Cliente 1—N Encargo, Encargo N—N Material) llegan con el change encargos.
export const defineModels = (sequelize) => {
  const ClienteModel = defineClienteModel(sequelize);
  const MaterialModel = defineMaterialModel(sequelize);

  return { ClienteModel, MaterialModel };
};

export default defineModels;
