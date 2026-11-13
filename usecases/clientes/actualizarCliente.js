import { obtenerCliente } from "./obtenerCliente.js";
import { asegurarEmailDisponible } from "./reglas.js";

// Caso de uso: modificación parcial de un cliente (spec "Modificación de cliente").
// Primero la existencia (404) y después la regla de email único (409).
export const actualizarCliente = async (id, changes, deps) => {
  const cliente = await obtenerCliente(id, deps);

  if (changes.email !== undefined) {
    await asegurarEmailDisponible(changes.email, deps, cliente.id);
  }

  return deps.clientesDao.update(id, changes);
};

export default actualizarCliente;
