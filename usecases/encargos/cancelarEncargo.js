import { aplicarTransicion } from "./transicion.js";

// Caso de uso: cancelar un encargo (spec "Cancelación con reposición de stock").
// Si estaba confirmado, repone lo descontado en la misma operación atómica.
const prepararReposicion = async (encargo) =>
  encargo.estado === "confirmado"
    ? encargo.materiales.map(({ materialId, cantidad }) => ({ materialId, delta: cantidad }))
    : [];

export const cancelarEncargo = async (id, deps) => aplicarTransicion(id, "cancelar", deps, prepararReposicion);

export default cancelarEncargo;
