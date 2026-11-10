import { Router } from "express";
import { PERSISTENCE_TYPE } from "../config/config.js";
import { makeHealthRouter } from "../routes/health.routes.js";

// Composition Root: resuelve dependencias y devuelve el router principal de la API.
// Es asíncrono para poder inicializar la persistencia (p. ej. sequelize.sync()) sin tocar index.js.
export const buildContainer = async () => {
  const router = Router();

  router.use(makeHealthRouter({ persistence: PERSISTENCE_TYPE }));

  return router;
};

export default buildContainer;
