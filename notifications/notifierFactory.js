import { consoleNotifier } from "./consoleNotifier.js";
import { createFileNotifier } from "./fileNotifier.js";

// Factory de notificadores (equivalente a daoFactory): elige el canal por configuración.
export const TIPOS_NOTIFICADOR = ["console", "file"];

export const crearNotificador = (tipo, { ruta } = {}) => {
  if (tipo === "console") return consoleNotifier;
  if (tipo === "file") return createFileNotifier({ ruta });
  throw new Error(`Tipo de notificador desconocido: "${tipo}". Valores permitidos: ${TIPOS_NOTIFICADOR.join(", ")}`);
};

export default crearNotificador;
