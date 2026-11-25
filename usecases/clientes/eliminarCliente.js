import { AppError } from "../../errors/AppError.js";
import { obtenerCliente } from "./obtenerCliente.js";

// Caso de uso: baja de un cliente (spec "Baja de cliente" y "Cliente con encargos no eliminable").
// Primero la existencia (404) y después la regla: con encargos en cualquier estado no se borra,
// para conservar el historial de trabajos (design D8 de encargos).
export const eliminarCliente = async (id, deps) => {
  await obtenerCliente(id, deps);

  if (await deps.encargosDao.existePorCliente(id)) {
    throw new AppError("CLIENTE_CON_ENCARGOS", "No se puede eliminar un cliente que tiene encargos", 409);
  }

  await deps.clientesDao.delete(id);
};

export default eliminarCliente;
