import { asegurarClienteExiste, asegurarMaterialesExisten } from "./reglas.js";

// Caso de uso: alta de encargo (spec "Alta de encargo"). Nace presupuestado.
export const crearEncargo = async (data, deps) => {
  const materiales = data.materiales ?? [];
  await asegurarClienteExiste(data.clienteId, deps);
  await asegurarMaterialesExisten(materiales, deps);

  return deps.encargosDao.save({
    clienteId: data.clienteId,
    descripcion: data.descripcion,
    fechaEntregaEstimada: data.fechaEntregaEstimada ?? null,
    materiales,
  });
};

export default crearEncargo;
