import { Router } from "express";
import {
  PERSISTENCE_TYPE,
  DB_STORAGE,
  DB_LOGGING,
  NOTIFIER_ENCARGOS,
  NOTIFIER_STOCK,
  NOTIFICATIONS_FILE,
} from "../config/config.js";
import { createDaos } from "../dao/daoFactory.js";
import { createEventBus } from "../events/eventBus.js";
import { crearNotificador } from "../notifications/notifierFactory.js";
import { registrarListeners } from "../listeners/registrarListeners.js";
import { makeHealthRouter } from "../routes/health.routes.js";
import { makeClientesUseCases } from "../usecases/clientes/makeClientesUseCases.js";
import { makeClientesController } from "../controllers/clientes.controller.js";
import { makeClientesRouter } from "../routes/clientes.routes.js";
import { makeMaterialesUseCases } from "../usecases/materiales/makeMaterialesUseCases.js";
import { makeMaterialesController } from "../controllers/materiales.controller.js";
import { makeMaterialesRouter } from "../routes/materiales.routes.js";
import { makeEncargosUseCases } from "../usecases/encargos/makeEncargosUseCases.js";
import { makeEncargosController } from "../controllers/encargos.controller.js";
import { makeEncargosRouter } from "../routes/encargos.routes.js";

// Notificadores por defecto, según configuración (un canal por tipo de aviso).
const notificadoresDeConfig = () => ({
  encargos: crearNotificador(NOTIFIER_ENCARGOS, { ruta: NOTIFICATIONS_FILE }),
  stock: crearNotificador(NOTIFIER_STOCK, { ruta: NOTIFICATIONS_FILE }),
});

// Composition Root: resuelve dependencias y devuelve el router principal de la API.
// Las opciones permiten elegir persistencia y notificadores desde los tests; por defecto, los de config.
// Devuelve { router, cerrar }: cerrar() libera la conexión a la base (si la hay).
export const buildContainer = async ({
  persistenceType = PERSISTENCE_TYPE,
  dbStorage = DB_STORAGE,
  dbLogging = DB_LOGGING,
  notificadores = notificadoresDeConfig(),
} = {}) => {
  // 1. DAOs: la factory elige memoria o Sequelize. Nada de lo que sigue depende de esa elección.
  const { clientesDao, materialesDao, encargosDao, cerrar } = await createDaos({ persistenceType, dbStorage, dbLogging });

  // 2. Eventos: el bus conecta a quien emite (casos de uso) con quien escucha (listeners → notificadores).
  const eventBus = createEventBus();
  registrarListeners(eventBus, notificadores);

  // 3. Casos de uso → controladores → routers.
  const router = Router();
  router.use(makeHealthRouter({ persistence: persistenceType }));

  const clientesController = makeClientesController(makeClientesUseCases({ clientesDao, encargosDao }));
  router.use("/clientes", makeClientesRouter(clientesController));

  const materialesController = makeMaterialesController(makeMaterialesUseCases({ materialesDao, encargosDao }));
  router.use("/materiales", makeMaterialesRouter(materialesController));

  const encargosUseCases = makeEncargosUseCases({ encargosDao, clientesDao, materialesDao, eventBus });
  router.use("/encargos", makeEncargosRouter(makeEncargosController(encargosUseCases)));

  return { router, cerrar };
};

export default buildContainer;
