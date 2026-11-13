import { Router } from "express";
import { PERSISTENCE_TYPE } from "../config/config.js";
import { makeHealthRouter } from "../routes/health.routes.js";
import { ClientesMemoryDao } from "../dao/clientes/clientes.memory.dao.js";
import { makeClientesUseCases } from "../usecases/clientes/makeClientesUseCases.js";
import { makeClientesController } from "../controllers/clientes.controller.js";
import { makeClientesRouter } from "../routes/clientes.routes.js";

// Composition Root: resuelve dependencias y devuelve el router principal de la API.
// Es asíncrono para poder inicializar la persistencia (p. ej. sequelize.sync()) sin tocar index.js.
// Las opciones permiten elegir la persistencia desde los tests; por defecto se usa la de config.
export const buildContainer = async ({ persistenceType = PERSISTENCE_TYPE } = {}) => {
  const router = Router();

  router.use(makeHealthRouter({ persistence: persistenceType }));

  // Clientes: DAO → casos de uso → controlador → router.
  // Provisorio (design D6 de clientes): siempre en memoria hasta que exista daoFactory (change persistencia-sequelize).
  const clientesDao = new ClientesMemoryDao();
  const clientesController = makeClientesController(makeClientesUseCases({ clientesDao }));
  router.use("/clientes", makeClientesRouter(clientesController));

  return router;
};

export default buildContainer;
