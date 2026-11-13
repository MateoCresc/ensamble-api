import { describe, it, expect, beforeEach } from "vitest";
import { makeClientesUseCases } from "../../../../usecases/clientes/makeClientesUseCases.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";
import { AppError } from "../../../../errors/AppError.js";

// Spec clientes — requisito "Consulta de cliente por id". El 404 lo lanza el caso de uso (design D3).
describe("obtenerCliente", () => {
  let useCases;

  beforeEach(() => {
    useCases = makeClientesUseCases({ clientesDao: new ClientesMemoryDao() });
  });

  it("cliente existente: devuelve sus datos", async () => {
    const creado = await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });

    const cliente = await useCases.obtenerCliente(creado.id);

    expect(cliente).toEqual(creado);
  });

  it("cliente inexistente: lanza 404 CLIENTE_NO_ENCONTRADO", async () => {
    const intento = useCases.obtenerCliente(999);

    await expect(intento).rejects.toBeInstanceOf(AppError);
    await expect(intento).rejects.toMatchObject({ code: "CLIENTE_NO_ENCONTRADO", statusCode: 404 });
  });

  it("devuelve una copia: modificar el resultado no altera el cliente guardado (design D1)", async () => {
    const creado = await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });

    const cliente = await useCases.obtenerCliente(creado.id);
    cliente.nombre = "Cambiado desde afuera";

    expect((await useCases.obtenerCliente(creado.id)).nombre).toBe("Ana Pérez");
  });
});
