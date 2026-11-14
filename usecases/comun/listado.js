// Herramientas compartidas por los casos de uso de listado (orden y paginación en memoria, design D2 de clientes).

export const LIMIT_POR_DEFECTO = 20;

export const compararTexto = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });

// sort: "campo" o "-campo" (descendente). A igualdad de valor se desempata por id ascendente.
// comparadores: { campo: (a, b) => número } con los campos permitidos por el schema.
export const ordenar = (items, sort = "id", comparadores) => {
  const descendente = sort.startsWith("-");
  const comparar = comparadores[descendente ? sort.slice(1) : sort];

  return [...items].sort((a, b) => {
    const resultado = comparar(a, b);
    if (resultado === 0) return a.id - b.id;
    return descendente ? -resultado : resultado;
  });
};

// Solo pagina si se pidió page o limit.
export const paginar = (items, { page, limit }) => {
  if (page === undefined && limit === undefined) return items;

  const pagina = page ?? 1;
  const tamanio = limit ?? LIMIT_POR_DEFECTO;
  const inicio = (pagina - 1) * tamanio;
  return items.slice(inicio, inicio + tamanio);
};
