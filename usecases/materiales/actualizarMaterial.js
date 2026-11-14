import { obtenerMaterial } from "./obtenerMaterial.js";
import { asegurarNombreDisponible } from "./reglas.js";

// Caso de uso: modificación parcial de un material. Primero la existencia (404), después el nombre único (409).
export const actualizarMaterial = async (id, changes, deps) => {
  const material = await obtenerMaterial(id, deps);

  if (changes.nombre !== undefined) {
    await asegurarNombreDisponible(changes.nombre, deps, material.id);
  }

  return deps.materialesDao.update(id, changes);
};

export default actualizarMaterial;
