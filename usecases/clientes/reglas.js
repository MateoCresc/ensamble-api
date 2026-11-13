import { AppError } from "../../errors/AppError.js";

// Reglas y errores compartidos por los casos de uso de Clientes.

export const clienteNoEncontrado = (id) =>
  new AppError("CLIENTE_NO_ENCONTRADO", `No existe un cliente con id ${id}`, 404);

// Regla de negocio "Email único": el email no puede pertenecer a OTRO cliente.
// idPropio permite que un cliente conserve su email al actualizarse.
export const asegurarEmailDisponible = async (email, { clientesDao }, idPropio) => {
  const existente = await clientesDao.getByEmail(email);
  if (existente && existente.id !== idPropio) {
    throw new AppError("EMAIL_DUPLICADO", "Ya existe un cliente con ese email", 409);
  }
};
