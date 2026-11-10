import { Router } from "express";

// GET /health: sin controlador ni caso de uso porque no tiene lógica de negocio (ver design D7).
// La persistencia se inyecta desde el contenedor; este módulo no lee config.
export const makeHealthRouter = ({ persistence }) => {
  const router = Router();
  router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", persistence });
  });
  return router;
};

export default makeHealthRouter;
