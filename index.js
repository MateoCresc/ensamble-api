import { PORT, NODE_ENV, PERSISTENCE_TYPE, DB_STORAGE } from "./config/config.js";
import { createApp } from "./app.js";

try {
  const app = await createApp();
  const destino = PERSISTENCE_TYPE === "sequelize" ? ` en ${DB_STORAGE}` : "";

  const server = app.listen(PORT, () => {
    console.log(`ensamble-api escuchando en http://localhost:${PORT} (${NODE_ENV}, persistencia: ${PERSISTENCE_TYPE}${destino})`);
  });

  // Apagado ordenado (Ctrl+C): deja de aceptar pedidos y cierra la conexión a la base.
  process.on("SIGINT", () => {
    server.close(async () => {
      await app.locals.cerrar();
      process.exit(0);
    });
  });
} catch (err) {
  console.error("No se pudo construir la aplicación:", err);
  process.exit(1);
}
