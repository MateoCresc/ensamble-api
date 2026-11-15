import { AppError } from "../../errors/AppError.js";
import { aplicarTransicion } from "./transicion.js";
import { EVENTOS } from "../../events/eventNames.js";

// Caso de uso: confirmar un encargo descontando el stock de todos sus materiales
// (spec "Confirmación con descuento de stock").

// Reglas propias de confirmar: tener materiales y que alcance el stock de todos.
// Devuelve los movimientos a aplicar (cantidades negativas).
const prepararDescuento = async (encargo, { materialesDao }) => {
  if (encargo.materiales.length === 0) {
    throw new AppError("ENCARGO_SIN_MATERIALES", "No se puede confirmar un encargo sin materiales", 409);
  }

  const faltantes = [];
  for (const { materialId, nombre, cantidad } of encargo.materiales) {
    const material = await materialesDao.getById(materialId);
    if (material.stock < cantidad) {
      faltantes.push({ materialId, nombre, requerido: cantidad, disponible: material.stock });
    }
  }
  if (faltantes.length > 0) {
    throw new AppError("STOCK_INSUFICIENTE", "No hay stock suficiente para confirmar el encargo", 409, faltantes);
  }

  return encargo.materiales.map(({ materialId, cantidad }) => ({ materialId, delta: -cantidad }));
};

// Efectos secundarios desacoplados: se emiten DESPUÉS de confirmar, porque describen algo que ya pasó.
// Quién avisa y por qué canal lo decide el módulo listeners/, no este caso de uso.
const emitirEventos = async (encargo, { eventBus, materialesDao }) => {
  eventBus.emit(EVENTOS.ENCARGO_CONFIRMADO, {
    encargoId: encargo.id,
    cliente: encargo.cliente,
    cantidadMateriales: encargo.materiales.length,
  });

  for (const { materialId } of encargo.materiales) {
    const material = await materialesDao.getById(materialId);
    if (material.stock <= material.stockMinimo) {
      eventBus.emit(EVENTOS.MATERIAL_STOCK_BAJO, {
        materialId,
        nombre: material.nombre,
        unidad: material.unidad,
        stock: material.stock,
        stockMinimo: material.stockMinimo,
      });
    }
  }
};

export const confirmarEncargo = async (id, deps) => {
  const confirmado = await aplicarTransicion(id, "confirmar", deps, (encargo) => prepararDescuento(encargo, deps));
  await emitirEventos(confirmado, deps);
  return confirmado;
};

export default confirmarEncargo;
