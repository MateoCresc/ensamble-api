import { describe, it, expect, beforeEach } from "vitest";
import { makeClientesUseCases } from "../../../../usecases/clientes/makeClientesUseCases.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";
import { EncargosMemoryDao } from "../../../../dao/encargos/encargos.memory.dao.js";

// Spec clientes — requisitos "Baja de cliente" y "Cliente con encargos no eliminable".
describe("eliminarCliente", () => {
  let useCases;
  let encargosDao;

  beforeEach(async () => {
    const clientesDao = new ClientesMemoryDao();
    encargosDao = new EncargosMemoryDao({ clientesDao, materialesDao: new MaterialesMemoryDao() });
    useCases = makeClientesUseCases({ clientesDao, encargosDao });
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

  it("baja de cliente con encargos: 409 CLIENTE_CON_ENCARGOS y el cliente sigue existiendo", async () => {
    await encargosDao.save({ clienteId: 1, descripcion: "Mesa" });

    await expect(useCases.eliminarCliente(1)).rejects.toMatchObject({ code: "CLIENTE_CON_ENCARGOS", statusCode: 409 });
    expect(await useCases.obtenerCliente(1)).toMatchObject({ id: 1 });
  });

  it("el bloqueo vale aunque el encargo esté cancelado (se conserva el historial)", async () => {
    const encargo = await encargosDao.save({ clienteId: 1, descripcion: "Mesa" });
    await encargosDao.cambiarEstado(encargo.id, { desde: ["presupuestado"], hacia: "cancelado" });

    await expect(useCases.eliminarCliente(1)).rejects.toMatchObject({ code: "CLIENTE_CON_ENCARGOS" });
  });
});
