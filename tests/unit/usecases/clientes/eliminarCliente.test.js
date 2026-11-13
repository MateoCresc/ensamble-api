import { describe, it, expect, beforeEach } from "vitest";
import { makeClientesUseCases } from "../../../../usecases/clientes/makeClientesUseCases.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";

// Spec clientes — requisito "Baja de cliente".
describe("eliminarCliente", () => {
  let useCases;

  beforeEach(async () => {
    useCases = makeClientesUseCases({ clientesDao: new ClientesMemoryDao() });
    await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });
  });

  it("cliente eliminado: ya no se puede obtener ni aparece en el listado", async () => {
    await useCases.eliminarCliente(1);

    await expect(useCases.obtenerCliente(1)).rejects.toMatchObject({ code: "CLIENTE_NO_ENCONTRADO" });
    expect(await useCases.listarClientes()).toEqual([]);
  });

  it("eliminar inexistente: lanza 404 CLIENTE_NO_ENCONTRADO", async () => {
    await expect(useCases.eliminarCliente(999)).rejects.toMatchObject({
      code: "CLIENTE_NO_ENCONTRADO",
      statusCode: 404,
    });
  });

  it("libera el email: se puede dar de alta otro cliente con el mismo email", async () => {
    await useCases.eliminarCliente(1);

    await expect(useCases.crearCliente({ nombre: "Ana Nueva", email: "ana@mail.com" })).resolves.toMatchObject({
      email: "ana@mail.com",
    });
  });
});
