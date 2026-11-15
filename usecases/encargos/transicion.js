import { AppError } from "../../errors/AppError.js";
import { obtenerEncargo } from "./obtenerEncargo.js";
import { asegurarTransicion, TRANSICIONES } from "./estados.js";

// Mecanismo común de las cuatro acciones del ciclo de vida (design D4):
// 1. El caso de uso valida existencia, transición y reglas propias de la acción (prepararMovimientos),
//    que además calcula los movimientos de stock { materialId, delta } que hay que aplicar.
// 2. El DAO aplica estado + stock de forma atómica, solo si el estado sigue siendo el leído.
// 3. Si el DAO no pudo (otro pedido cambió el encargo o el stock en el medio), se relee y se vuelve
//    a validar para devolver el error correcto; si igual "debería" poder, es un conflicto de concurrencia.
export const aplicarTransicion = async (id, accion, deps, prepararMovimientos = async () => []) => {
  const encargo = await obtenerEncargo(id, deps);
  asegurarTransicion(encargo, accion);
  const movimientos = await prepararMovimientos(encargo);

  const actualizado = await deps.encargosDao.cambiarEstado(id, {
    desde: [encargo.estado],
    hacia: TRANSICIONES[accion].hacia,
    movimientos,
  });
  if (actualizado) return actualizado;

  const actual = await obtenerEncargo(id, deps);
  asegurarTransicion(actual, accion);
  await prepararMovimientos(actual);
  throw new AppError(
    "CONFLICTO_CONCURRENTE",
    "El encargo o el stock cambiaron mientras se procesaba el pedido; volvé a intentarlo",
    409
  );
};
