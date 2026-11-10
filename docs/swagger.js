import { readFileSync } from "node:fs";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const spec = YAML.parse(readFileSync(new URL("./openapi.yaml", import.meta.url), "utf8"));

// Publica la especificación en /api-docs.json y Swagger UI en /api-docs.
export const makeDocsRouter = () => {
  const router = Router();
  router.get("/api-docs.json", (req, res) => res.json(spec));
  router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
  return router;
};

export default makeDocsRouter;
