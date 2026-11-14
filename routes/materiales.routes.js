import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  crearMaterialSchema,
  actualizarMaterialSchema,
  materialIdParamSchema,
  listarMaterialesQuerySchema,
} from "../schemas/materiales.schema.js";

// Rutas de /materiales. Recibe el controlador ya armado desde el contenedor.
export const makeMaterialesRouter = (controller) => {
  const router = Router();
  const conId = validate(materialIdParamSchema, "params");

  router.get("/", validate(listarMaterialesQuerySchema, "query"), controller.listar);
  router.get("/:id", conId, controller.obtener);
  router.post("/", validate(crearMaterialSchema), controller.crear);
  router.put("/:id", conId, validate(actualizarMaterialSchema), controller.actualizar);
  router.delete("/:id", conId, controller.eliminar);

  return router;
};

export default makeMaterialesRouter;
