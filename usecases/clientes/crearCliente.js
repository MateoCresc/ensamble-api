import { asegurarEmailDisponible } from "./reglas.js";

// Caso de uso: alta de cliente (spec "Alta de cliente" y "Email único").
export const crearCliente = async (data, deps) => {
  await asegurarEmailDisponible(data.email, deps);
  return deps.clientesDao.save(data);
};

export default crearCliente;
