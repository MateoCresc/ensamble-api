import express from "express";
import { PORT, NODE_ENV, PERSISTENCE_TYPE } from "./config/config.js";
import { buildContainer } from "./container/container.js";
import { makeDocsRouter } from "./docs/swagger.js";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(logger);
app.use(express.json());
app.use(makeDocsRouter());

try {
  app.use(await buildContainer());
} catch (err) {
  console.error("No se pudo construir el contenedor de dependencias:", err);
  process.exit(1);
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ensamble-api escuchando en http://localhost:${PORT} (${NODE_ENV}, persistencia: ${PERSISTENCE_TYPE})`);
});
