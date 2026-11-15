import { compararTexto, ordenar, paginar } from "../comun/listado.js";

// Caso de uso: listado de clientes con filtros, orden y paginación (design D2).
// Se resuelve en memoria sobre dao.getAll() para que la interfaz del DAO sea mínima e igual en ambos adaptadores.
// Los filtros llegan validados por el schema: sort permitido y page/limit enteros.

const COMPARADORES = {
  id: (a, b) => a.id - b.id,
  nombre: (a, b) => compararTexto(a.nombre, b.nombre),
  email: (a, b) => compararTexto(a.email, b.email),
};

const filtrar = (clientes, { nombre, email }) => {
  let resultado = clientes;
  if (nombre) {
    const buscado = nombre.toLowerCase();
    resultado = resultado.filter((c) => c.nombre.toLowerCase().includes(buscado));
  }
  if (email) {
    const buscado = email.toLowerCase();
    resultado = resultado.filter((c) => c.email.toLowerCase() === buscado);
  }
  return resultado;
};

export const listarClientes = async (filtros = {}, { clientesDao }) => {
  const clientes = await clientesDao.getAll();
  return paginar(ordenar(filtrar(clientes, filtros), filtros.sort, COMPARADORES), filtros);
};

export default listarClientes;
