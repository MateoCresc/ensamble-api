import { obtenerEncargo } from "./obtenerEncargo.js";
import { asegurarEliminable } from "./estados.js";

// Caso de uso: baja de un encargo presupuestado o cancelado (spec "Baja de encargo").
export const eliminarEncargo = async (id, deps) => {
  const encargo = await obtenerEncargo(id, deps);
  asegurarEliminable(encargo);
  await deps.encargosDao.delete(id);
};

export default eliminarEncargo;
