import { AppError } from "../../errors/AppError.js";

// Máquina de estados de un encargo (design D3). Es el único lugar donde se decide qué acción
// vale en qué estado: una regla nueva ("no se puede cancelar un confirmado") es un cambio de una línea.

export const ESTADOS = ["presupuestado", "confirmado", "en_produccion", "entregado", "cancelado"];

export const TRANSICIONES = {
  confirmar: { desde: ["presupuestado"], hacia: "confirmado" },
  cancelar: { desde: ["presupuestado", "confirmado"], hacia: "cancelado" },
  iniciar: { desde: ["confirmado"], hacia: "en_produccion" },
  entregar: { desde: ["en_produccion"], hacia: "entregado" },
};

// Estados en los que el encargo se puede modificar o eliminar (design D7).
export const EDITABLES = ["presupuestado"];
export const ELIMINABLES = ["presupuestado", "cancelado"];

export const asegurarTransicion = (encargo, accion) => {
  if (!TRANSICIONES[accion].desde.includes(encargo.estado)) {
    throw new AppError(
      "TRANSICION_INVALIDA",
      `No se puede ${accion} un encargo en estado ${encargo.estado}`,
      409,
      { estadoActual: encargo.estado, accion }
    );
  }
};

export const asegurarEditable = (encargo) => {
  if (!EDITABLES.includes(encargo.estado)) {
    throw new AppError("ENCARGO_NO_EDITABLE", `Un encargo ${encargo.estado} no se puede modificar`, 409);
  }
};

export const asegurarEliminable = (encargo) => {
  if (!ELIMINABLES.includes(encargo.estado)) {
    throw new AppError(
      "ENCARGO_NO_ELIMINABLE",
      `Un encargo ${encargo.estado} no se puede eliminar; cancelalo primero`,
      409
    );
  }
};
