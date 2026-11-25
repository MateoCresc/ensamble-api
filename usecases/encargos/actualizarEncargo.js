import { obtenerEncargo } from "./obtenerEncargo.js";
import { asegurarEditable } from "./estados.js";
import { asegurarMaterialesExisten } from "./reglas.js";

// Caso de uso: modificación de un encargo presupuestado (spec "Modificación de encargo presupuestado").
export const actualizarEncargo = async (id, changes, deps) => {
  const encargo = await obtenerEncargo(id, deps);
  asegurarEditable(encargo);
  if (changes.materiales) await asegurarMaterialesExisten(changes.materiales, deps);

  return deps.encargosDao.update(id, changes);
};

export default actualizarEncargo;
