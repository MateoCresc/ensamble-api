import { aplicarTransicion } from "./transicion.js";

// Caso de uso: marcar como entregado un encargo en producción (spec "Avance de producción").
export const entregarEncargo = async (id, deps) => aplicarTransicion(id, "entregar", deps);

export default entregarEncargo;
