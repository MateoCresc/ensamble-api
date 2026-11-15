import { Router } from "express";
import { PERSISTENCE_TYPE, DB_STORAGE, DB_LOGGING } from "../config/config.js";
import { createDaos } from "../dao/daoFactory.js";
import { makeHealthRouter } from "../routes/health.routes.js";
import { makeClientesUseCases } from "../usecases/clientes/makeClientesUseCases.js";
import { makeClientesController } from "../controllers/clientes.controller.js";
import { makeClientesRouter } from "../routes/clientes.routes.js";
import { makeMaterialesUseCases } from "../usecases/materiales/makeMaterialesUseCases.js";
import { makeMaterialesController } from "../controllers/materiales.controller.js";
import { makeMaterialesRouter } from "../routes/materiales.routes.js";

// Composition Root: resuelve dependencias y devuelve el router principal de la API.
// Las opciones permiten elegir la persistencia desde los tests; por defecto se usan las de config.
// Devuelve { router, cerrar }: cerrar() libera la conexión a la base (si la hay).
export const buildContainer = async ({
  persistenceType = PERSISTENCE_TYPE,
  dbStorage = DB_STORAGE,
  dbLogging = DB_LOGGING,
} = {}) => {
  // 1. DAOs: la factory elige memoria o Sequelize. Nada de lo que sigue depende de esa elección.
  const { clientesDao, materialesDao, cerrar } = await createDaos({ persistenceType, dbStorage, dbLogging });

  // 2. Casos de uso → controladores → routers.
  const router = Router();
  router.use(makeHealthRouter({ persistence: persistenceType }));

  const clientesController = makeClientesController(makeClientesUseCases({ clientesDao }));
  router.use("/clientes", makeClientesRouter(clientesController));

  const materialesController = makeMaterialesController(makeMaterialesUseCases({ materialesDao }));
  router.use("/materiales", makeMaterialesRouter(materialesController));

  return { router, cerrar };
};

export default buildContainer;
