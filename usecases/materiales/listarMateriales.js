import { compararTexto, ordenar, paginar } from "../comun/listado.js";

// Caso de uso: listado de materiales con filtros, orden y paginación (mismo enfoque que clientes).

const COMPARADORES = {
  id: (a, b) => a.id - b.id,
  nombre: (a, b) => compararTexto(a.nombre, b.nombre),
  stock: (a, b) => a.stock - b.stock,
};

const enBajoStock = (material) => material.stock <= material.stockMinimo;

const filtrar = (materiales, { nombre, unidad, bajoStock }) => {
  let resultado = materiales;
  if (nombre) {
    const buscado = nombre.toLowerCase();
    resultado = resultado.filter((m) => m.nombre.toLowerCase().includes(buscado));
  }
  if (unidad) {
    resultado = resultado.filter((m) => m.unidad === unidad);
  }
  if (bajoStock !== undefined) {
    resultado = resultado.filter((m) => enBajoStock(m) === bajoStock);
  }
  return resultado;
};

export const listarMateriales = async (filtros = {}, { materialesDao }) => {
  const materiales = await materialesDao.getAll();
  return paginar(ordenar(filtrar(materiales, filtros), filtros.sort, COMPARADORES), filtros);
};

export default listarMateriales;
