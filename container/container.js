import { Router } from "express";
import { PERSISTENCE_TYPE } from "../config/config.js";
import { makeHealthRouter } from "../routes/health.routes.js";

// Composition Root: resuelve dependencias y devuelve el router principal de la API.
// Es asíncrono para poder inicializar la persistencia (p. ej. sequelize.sync()) sin tocar index.js.
// Las opciones permiten elegir la persistencia desde los tests; por defecto se usa la de config.
export const buildContainer = async ({ persistenceType = PERSISTENCE_TYPE } = {}) => {
  const router = Router();

  router.use(makeHealthRouter({ persistence: persistenceType }));

  return router;
};

export default buildContainer;
