import { clienteNoEncontrado } from "./reglas.js";

// Caso de uso: consulta de un cliente por id.
// La inexistencia es una condición del dominio, por eso el 404 se lanza acá y no en el controlador (design D3).
export const obtenerCliente = async (id, { clientesDao }) => {
  const cliente = await clientesDao.getById(id);
  if (!cliente) throw clienteNoEncontrado(id);
  return cliente;
};

export default obtenerCliente;
