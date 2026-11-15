import { createApp } from "../../app.js";

// Modos de persistencia en los que corren los tests HTTP (design D6 de persistencia-materiales).
export const MODOS_PERSISTENCIA = ["memory", "sequelize"];

// Arma la app completa para tests HTTP. Por defecto en memoria; en modo sequelize usa una base
// SQLite en memoria (":memory:"), nueva y vacía para cada app. Cualquier opción recibida pisa los defaults.
export const buildTestApp = (options = {}) =>
  createApp({ persistenceType: "memory", dbStorage: ":memory:", ...options });

export default buildTestApp;
