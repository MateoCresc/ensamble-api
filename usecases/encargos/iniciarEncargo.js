import { aplicarTransicion } from "./transicion.js";

// Caso de uso: pasar un encargo confirmado a producción (spec "Avance de producción").
export const iniciarEncargo = async (id, deps) => aplicarTransicion(id, "iniciar", deps);

export default iniciarEncargo;
