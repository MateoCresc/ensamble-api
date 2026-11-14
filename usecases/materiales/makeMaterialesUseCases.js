import { listarMateriales } from "./listarMateriales.js";
import { obtenerMaterial } from "./obtenerMaterial.js";
import { crearMaterial } from "./crearMaterial.js";
import { actualizarMaterial } from "./actualizarMaterial.js";
import { eliminarMaterial } from "./eliminarMaterial.js";

// Factory de casos de uso de Materiales: recibe las dependencias como objeto.
export const makeMaterialesUseCases = ({ materialesDao }) => {
  const deps = { materialesDao };

  return {
    listarMateriales: (filtros) => listarMateriales(filtros, deps),
    obtenerMaterial: (id) => obtenerMaterial(id, deps),
    crearMaterial: (data) => crearMaterial(data, deps),
    actualizarMaterial: (id, changes) => actualizarMaterial(id, changes, deps),
    eliminarMaterial: (id) => eliminarMaterial(id, deps),
  };
};

export default makeMaterialesUseCases;
