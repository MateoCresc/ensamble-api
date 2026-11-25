import { ordenar, paginar } from "../comun/listado.js";

// Caso de uso: listado de encargos con filtros por cliente y estado, orden por id y paginación.

const COMPARADORES = { id: (a, b) => a.id - b.id };

const filtrar = (encargos, { clienteId, estado }) =>
  encargos.filter(
    (e) => (clienteId === undefined || e.clienteId === clienteId) && (estado === undefined || e.estado === estado)
  );

export const listarEncargos = async (filtros = {}, { encargosDao }) => {
  const encargos = await encargosDao.getAll();
  return paginar(ordenar(filtrar(encargos, filtros), filtros.sort, COMPARADORES), filtros);
};

export default listarEncargos;
