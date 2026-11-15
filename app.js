import express from "express";
import { buildContainer } from "./container/container.js";
import { makeDocsRouter } from "./docs/swagger.js";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Arma la app Express completa sin escuchar ningún puerto (ver design D1 de infraestructura-tests).
// Las opciones (p. ej. persistenceType) se propagan al contenedor; sin opciones se usan los valores de config.
export const createApp = async (options = {}) => {
  const app = express();

  app.use(logger);
  app.use(express.json());
  app.use(makeDocsRouter());
  const { router, cerrar } = await buildContainer(options);
  app.use(router);
  // Permite cerrar la conexión a la base desde index.js (apagado) o desde los tests.
  app.locals.cerrar = cerrar;
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
