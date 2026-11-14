import { materialNoEncontrado } from "./reglas.js";

// Caso de uso: consulta de un material por id. El 404 se lanza en el dominio (design D3 de clientes).
export const obtenerMaterial = async (id, { materialesDao }) => {
  const material = await materialesDao.getById(id);
  if (!material) throw materialNoEncontrado(id);
  return material;
};

export default obtenerMaterial;
