import { encargoNoEncontrado } from "./reglas.js";

// Caso de uso: consulta de un encargo con su cliente y materiales.
export const obtenerEncargo = async (id, { encargosDao }) => {
  const encargo = await encargosDao.getById(id);
  if (!encargo) throw encargoNoEncontrado(id);
  return encargo;
};

export default obtenerEncargo;
