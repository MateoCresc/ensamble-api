import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  crearClienteSchema,
  actualizarClienteSchema,
  clienteIdParamSchema,
  listarClientesQuerySchema,
} from "../schemas/clientes.schema.js";

// Rutas de /clientes. Recibe el controlador ya armado desde el contenedor.
export const makeClientesRouter = (controller) => {
  const router = Router();
  const conId = validate(clienteIdParamSchema, "params");

  router.get("/", validate(listarClientesQuerySchema, "query"), controller.listar);
  router.get("/:id", conId, controller.obtener);
  router.post("/", validate(crearClienteSchema), controller.crear);
  router.put("/:id", conId, validate(actualizarClienteSchema), controller.actualizar);
  router.delete("/:id", conId, controller.eliminar);

  return router;
};

export default makeClientesRouter;
