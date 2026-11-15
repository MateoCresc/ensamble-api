import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  crearEncargoSchema,
  actualizarEncargoSchema,
  encargoIdParamSchema,
  listarEncargosQuerySchema,
} from "../schemas/encargos.schema.js";

// Rutas de /encargos. Cada transición de estado es un endpoint propio (design D10).
export const makeEncargosRouter = (controller) => {
  const router = Router();
  const conId = validate(encargoIdParamSchema, "params");

  router.get("/", validate(listarEncargosQuerySchema, "query"), controller.listar);
  router.get("/:id", conId, controller.obtener);
  router.post("/", validate(crearEncargoSchema), controller.crear);
  router.put("/:id", conId, validate(actualizarEncargoSchema), controller.actualizar);
  router.delete("/:id", conId, controller.eliminar);

  router.put("/:id/confirmar", conId, controller.confirmar);
  router.put("/:id/cancelar", conId, controller.cancelar);
  router.put("/:id/iniciar", conId, controller.iniciar);
  router.put("/:id/entregar", conId, controller.entregar);

  return router;
};

export default makeEncargosRouter;
