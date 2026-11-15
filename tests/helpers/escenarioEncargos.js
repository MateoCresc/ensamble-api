import { EventEmitter } from "node:events";
import { ClientesMemoryDao } from "../../dao/clientes/clientes.memory.dao.js";
import { MaterialesMemoryDao } from "../../dao/materiales/materiales.memory.dao.js";
import { EncargosMemoryDao } from "../../dao/encargos/encargos.memory.dao.js";
import { makeEncargosUseCases } from "../../usecases/encargos/makeEncargosUseCases.js";

// Arma los casos de uso de encargos con DAOs en memoria nuevos, un bus de eventos real
// y datos base: dos clientes y dos materiales.
export const escenarioEncargos = async () => {
  const clientesDao = new ClientesMemoryDao();
  const materialesDao = new MaterialesMemoryDao();
  const encargosDao = new EncargosMemoryDao({ clientesDao, materialesDao });
  const eventBus = new EventEmitter();
  const useCases = makeEncargosUseCases({ encargosDao, clientesDao, materialesDao, eventBus });

  const ana = await clientesDao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });
  const luis = await clientesDao.save({ nombre: "Luis Sosa", email: "luis@mail.com" });
  const pino = await materialesDao.save({ nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 });
  const canio = await materialesDao.save({ nombre: "Caño de hierro", unidad: "m", stock: 3, stockMinimo: 1 });

  return { useCases, eventBus, clientesDao, materialesDao, encargosDao, ana, luis, pino, canio };
};

export default escenarioEncargos;
