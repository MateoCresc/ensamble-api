import { AppError } from "../../errors/AppError.js";
import { obtenerMaterial } from "./obtenerMaterial.js";

// Caso de uso: baja de un material (spec "Baja de material" y "Material en uso no eliminable").
export const eliminarMaterial = async (id, deps) => {
  await obtenerMaterial(id, deps);

  if (await deps.encargosDao.existePorMaterial(id)) {
    throw new AppError("MATERIAL_EN_USO", "No se puede eliminar un material que figura en encargos", 409);
  }

  await deps.materialesDao.delete(id);
};

export default eliminarMaterial;
