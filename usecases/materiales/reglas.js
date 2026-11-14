import { AppError } from "../../errors/AppError.js";

// Reglas y errores compartidos por los casos de uso de Materiales.

export const materialNoEncontrado = (id) =>
  new AppError("MATERIAL_NO_ENCONTRADO", `No existe un material con id ${id}`, 404);

// Regla de negocio "Nombre único de material": el nombre no puede pertenecer a OTRO material.
export const asegurarNombreDisponible = async (nombre, { materialesDao }, idPropio) => {
  const existente = await materialesDao.getByNombre(nombre);
  if (existente && existente.id !== idPropio) {
    throw new AppError("MATERIAL_DUPLICADO", "Ya existe un material con ese nombre", 409);
  }
};
