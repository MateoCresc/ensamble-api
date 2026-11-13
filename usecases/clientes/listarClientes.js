// Caso de uso: listado de clientes con filtros, orden y paginación (design D2).
// Se resuelve en memoria sobre dao.getAll() para que la interfaz del DAO sea mínima e igual en ambos adaptadores.
// Los filtros llegan validados por el schema: sort permitido y page/limit enteros.

const LIMIT_POR_DEFECTO = 20;

const compararTexto = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });

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

// "-campo" ordena descendente. A igualdad de valor se desempata por id ascendente.
const ordenar = (clientes, sort = "id") => {
  const descendente = sort.startsWith("-");
  const comparar = COMPARADORES[descendente ? sort.slice(1) : sort];

  return [...clientes].sort((a, b) => {
    const resultado = comparar(a, b);
    if (resultado === 0) return a.id - b.id;
    return descendente ? -resultado : resultado;
  });
};

// Solo pagina si se pidió page o limit (spec "Paginación del listado").
const paginar = (clientes, { page, limit }) => {
  if (page === undefined && limit === undefined) return clientes;

  const pagina = page ?? 1;
  const tamanio = limit ?? LIMIT_POR_DEFECTO;
  const inicio = (pagina - 1) * tamanio;
  return clientes.slice(inicio, inicio + tamanio);
};

export const listarClientes = async (filtros = {}, { clientesDao }) => {
  const clientes = await clientesDao.getAll();
  return paginar(ordenar(filtrar(clientes, filtros), filtros.sort), filtros);
};

export default listarClientes;
