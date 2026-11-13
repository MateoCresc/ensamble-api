import { listarClientes } from "./listarClientes.js";
import { obtenerCliente } from "./obtenerCliente.js";
import { crearCliente } from "./crearCliente.js";
import { actualizarCliente } from "./actualizarCliente.js";
import { eliminarCliente } from "./eliminarCliente.js";

// Factory de casos de uso de Clientes.
// Recibe las dependencias como objeto (design D6): sumar el bus de eventos u otro DAO no cambia la firma.
export const makeClientesUseCases = ({ clientesDao }) => {
  const deps = { clientesDao };

  return {
    listarClientes: (filtros) => listarClientes(filtros, deps),
    obtenerCliente: (id) => obtenerCliente(id, deps),
    crearCliente: (data) => crearCliente(data, deps),
    actualizarCliente: (id, changes) => actualizarCliente(id, changes, deps),
    eliminarCliente: (id) => eliminarCliente(id, deps),
  };
};

export default makeClientesUseCases;
