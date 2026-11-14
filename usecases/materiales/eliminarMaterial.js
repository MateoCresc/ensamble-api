import { materialNoEncontrado } from "./reglas.js";

// Caso de uso: baja de un material (spec "Baja de material").
export const eliminarMaterial = async (id, { materialesDao }) => {
  const eliminado = await materialesDao.delete(id);
  if (!eliminado) throw materialNoEncontrado(id);
};

export default eliminarMaterial;
