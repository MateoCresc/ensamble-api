import { createSequelize } from "../connection/sequelize.js";
import { defineModels } from "./models/index.js";
import { ClientesMemoryDao } from "./clientes/clientes.memory.dao.js";
import { ClientesSequelizeDao } from "./clientes/clientes.sequelize.dao.js";
import { MaterialesMemoryDao } from "./materiales/materiales.memory.dao.js";
import { MaterialesSequelizeDao } from "./materiales/materiales.sequelize.dao.js";
import { EncargosMemoryDao } from "./encargos/encargos.memory.dao.js";
import { EncargosSequelizeDao } from "./encargos/encargos.sequelize.dao.js";

// Factory de DAOs (consigna 2.4, design D2): elige los adaptadores según persistenceType.
// Es el único lugar que conoce las implementaciones concretas de persistencia.
// Devuelve también cerrar(), para liberar la conexión al apagar el servidor o al terminar un test.
export const createDaos = async ({ persistenceType, dbStorage, dbLogging = false }) => {
  if (persistenceType === "memory") {
    const clientesDao = new ClientesMemoryDao();
    const materialesDao = new MaterialesMemoryDao();
    return {
      clientesDao,
      materialesDao,
      // En memoria, encargos colabora con los otros DAO para armar relaciones y mover stock.
      encargosDao: new EncargosMemoryDao({ clientesDao, materialesDao }),
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
      encargosDao: new EncargosSequelizeDao(modelos),
      cerrar: () => sequelize.close(),
    };
  }

  throw new Error(`Tipo de persistencia desconocido: "${persistenceType}"`);
};

export default createDaos;
