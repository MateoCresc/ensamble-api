import { PORT, NODE_ENV, PERSISTENCE_TYPE } from "./config/config.js";
import { createApp } from "./app.js";

try {
  const app = await createApp();
  app.listen(PORT, () => {
    console.log(`ensamble-api escuchando en http://localhost:${PORT} (${NODE_ENV}, persistencia: ${PERSISTENCE_TYPE})`);
  });
} catch (err) {
  console.error("No se pudo construir la aplicación:", err);
  process.exit(1);
}
