import { appendFile } from "node:fs/promises";

// Notificador a archivo: agrega una línea "fecha ISO | asunto | mensaje" por aviso.
// Misma interfaz que consoleNotifier, así el listener no cambia al cambiar de canal.
export const createFileNotifier = ({ ruta }) => ({
  async notificar({ asunto, mensaje }) {
    await appendFile(ruta, `${new Date().toISOString()} | ${asunto} | ${mensaje}\n`, "utf8");
  },
});

export default createFileNotifier;
