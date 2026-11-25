// Único módulo que lee process.env. El resto de la app importa desde acá.

const PERSISTENCE_TYPES = ["memory", "sequelize"];

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const persistence = (process.env.PERSISTENCE_TYPE ?? "memory").trim().toLowerCase();

if (!PERSISTENCE_TYPES.includes(persistence)) {
  throw new Error(
    `PERSISTENCE_TYPE inválido: "${persistence}". Valores permitidos: ${PERSISTENCE_TYPES.join(", ")}`
  );
}

export const PORT = toInt(process.env.PORT, 3000);
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const PERSISTENCE_TYPE = persistence;

// Persistencia Sequelize (design D7 de persistencia-materiales)
export const DB_STORAGE = process.env.DB_STORAGE?.trim() || "./ensamble.sqlite";
export const DB_LOGGING = (process.env.DB_LOGGING ?? "false").trim().toLowerCase() === "true";

// Notificaciones (design D6 de encargos): canal de cada aviso y archivo para el canal "file".
const NOTIFIER_TYPES = ["console", "file"];
const notificador = (variable, porDefecto) => {
  const valor = (process.env[variable] ?? porDefecto).trim().toLowerCase();
  if (!NOTIFIER_TYPES.includes(valor)) {
    throw new Error(`${variable} inválido: "${valor}". Valores permitidos: ${NOTIFIER_TYPES.join(", ")}`);
  }
  return valor;
};

export const NOTIFIER_ENCARGOS = notificador("NOTIFIER_ENCARGOS", "console");
export const NOTIFIER_STOCK = notificador("NOTIFIER_STOCK", "file");
export const NOTIFICATIONS_FILE = process.env.NOTIFICATIONS_FILE?.trim() || "./notificaciones.log";

export default {
  PORT,
  NODE_ENV,
  PERSISTENCE_TYPE,
  DB_STORAGE,
  DB_LOGGING,
  NOTIFIER_ENCARGOS,
  NOTIFIER_STOCK,
  NOTIFICATIONS_FILE,
};
