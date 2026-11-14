import { asegurarNombreDisponible } from "./reglas.js";

// Caso de uso: alta de material (spec "Alta de material" y "Nombre único de material").
export const crearMaterial = async (data, deps) => {
  await asegurarNombreDisponible(data.nombre, deps);
  return deps.materialesDao.save(data);
};

export default crearMaterial;
