import { createApp } from "../../app.js";

// Arma la app completa para tests HTTP con persistencia en memoria por defecto.
// Cualquier opción recibida (p. ej. persistenceType) pisa el valor por defecto.
export const buildTestApp = (options = {}) => createApp({ persistenceType: "memory", ...options });

export default buildTestApp;
