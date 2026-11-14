import { createSequelize } from "../connection/sequelize.js";
import { defineModels } from "./models/index.js";
import { ClientesMemoryDao } from "./clientes/clientes.memory.dao.js";
import { ClientesSequelizeDao } from "./clientes/clientes.sequelize.dao.js";
import { MaterialesMemoryDao } from "./materiales/materiales.memory.dao.js";
import { MaterialesSequelizeDao } from "./materiales/materiales.sequelize.dao.js";

// Factory de DAOs (consigna 2.4, design D2): elige los adaptadores según persistenceType.
// Es el único lugar que conoce las implementaciones concretas de persistencia.
// Devuelve también cerrar(), para liberar la conexión al apagar el servidor o al terminar un test.
export const createDaos = async ({ persistenceType, dbStorage, dbLogging = false }) => {
  if (persistenceType === "memory") {
    return {
      clientesDao: new ClientesMemoryDao(),
      materialesDao: new MaterialesMemoryDao(),
      cerrar: async () => {},
    };
  }

  if (persistenceType === "sequelize") {
    const sequelize = createSequelize({ storage: dbStorage, logging: dbLogging });
    const modelos = defineModels(sequelize);
    // Crea las tablas que falten sin tocar datos existentes (sin alter ni force, ver design D2).
    await sequelize.sync();

    return {
      clientesDao: new ClientesSequelizeDao(modelos),
      materialesDao: new MaterialesSequelizeDao(modelos),
      cerrar: () => sequelize.close(),
    };
  }

  throw new Error(`Tipo de persistencia desconocido: "${persistenceType}"`);
};

export default createDaos;
