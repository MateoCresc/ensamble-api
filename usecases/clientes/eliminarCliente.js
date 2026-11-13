import { clienteNoEncontrado } from "./reglas.js";

// Caso de uso: baja de un cliente (spec "Baja de cliente").
export const eliminarCliente = async (id, { clientesDao }) => {
  const eliminado = await clientesDao.delete(id);
  if (!eliminado) throw clienteNoEncontrado(id);
};

export default eliminarCliente;
