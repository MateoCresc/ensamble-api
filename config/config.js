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

export default { PORT, NODE_ENV, PERSISTENCE_TYPE };
