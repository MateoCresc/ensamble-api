import { AppError } from "../../errors/AppError.js";
import { clienteNoEncontrado } from "../clientes/reglas.js";

// Reglas y errores compartidos por los casos de uso de Encargos.

export const encargoNoEncontrado = (id) =>
  new AppError("ENCARGO_NO_ENCONTRADO", `No existe un encargo con id ${id}`, 404);

export const asegurarClienteExiste = async (clienteId, { clientesDao }) => {
  if (!(await clientesDao.getById(clienteId))) throw clienteNoEncontrado(clienteId);
};

// Todos los materiales pedidos deben existir; si falta alguno, se informan todos los ids inexistentes.
export const asegurarMaterialesExisten = async (materiales, { materialesDao }) => {
  const ids = materiales.map((m) => m.materialId);
  const encontrados = await Promise.all(ids.map((id) => materialesDao.getById(id)));
  const inexistentes = ids.filter((_, i) => !encontrados[i]);
  if (inexistentes.length > 0) {
    throw new AppError(
      "MATERIAL_NO_ENCONTRADO",
      `No existen los materiales: ${inexistentes.join(", ")}`,
      404,
      { ids: inexistentes }
    );
  }
};
