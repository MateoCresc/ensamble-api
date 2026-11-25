// Nombres de los eventos de dominio: el contrato entre quien emite (casos de uso) y quien escucha (listeners).
// Convención "entidad.hecho": describen algo que YA ocurrió, no una orden.
export const EVENTOS = Object.freeze({
  ENCARGO_CONFIRMADO: "encargo.confirmado",
  MATERIAL_STOCK_BAJO: "material.stockBajo",
});

export default EVENTOS;
