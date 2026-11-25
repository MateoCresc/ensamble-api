import { listarEncargos } from "./listarEncargos.js";
import { obtenerEncargo } from "./obtenerEncargo.js";
import { crearEncargo } from "./crearEncargo.js";
import { actualizarEncargo } from "./actualizarEncargo.js";
import { eliminarEncargo } from "./eliminarEncargo.js";
import { confirmarEncargo } from "./confirmarEncargo.js";
import { cancelarEncargo } from "./cancelarEncargo.js";
import { iniciarEncargo } from "./iniciarEncargo.js";
import { entregarEncargo } from "./entregarEncargo.js";

// Factory de casos de uso de Encargos. Necesita los tres DAO (encargos, y clientes y materiales
// para validar referencias y stock) y el bus de eventos.
export const makeEncargosUseCases = ({ encargosDao, clientesDao, materialesDao, eventBus }) => {
  const deps = { encargosDao, clientesDao, materialesDao, eventBus };

  return {
    listarEncargos: (filtros) => listarEncargos(filtros, deps),
    obtenerEncargo: (id) => obtenerEncargo(id, deps),
    crearEncargo: (data) => crearEncargo(data, deps),
    actualizarEncargo: (id, changes) => actualizarEncargo(id, changes, deps),
    eliminarEncargo: (id) => eliminarEncargo(id, deps),
    confirmarEncargo: (id) => confirmarEncargo(id, deps),
    cancelarEncargo: (id) => cancelarEncargo(id, deps),
    iniciarEncargo: (id) => iniciarEncargo(id, deps),
    entregarEncargo: (id) => entregarEncargo(id, deps),
  };
};

export default makeEncargosUseCases;
