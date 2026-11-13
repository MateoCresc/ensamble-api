import { describe, it, expect, beforeEach } from "vitest";
import { makeClientesUseCases } from "../../../../usecases/clientes/makeClientesUseCases.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";

// Spec clientes — requisitos "Modificación de cliente" y "Email único".
describe("actualizarCliente", () => {
  let useCases;

  beforeEach(async () => {
    useCases = makeClientesUseCases({ clientesDao: new ClientesMemoryDao() });
    await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com", telefono: "1155550000" });
    await useCases.crearCliente({ nombre: "Luis Sosa", email: "luis@mail.com" });
  });

  it("actualización parcial: cambia solo los campos enviados", async () => {
    const actualizado = await useCases.actualizarCliente(1, { telefono: "1166660000" });

    expect(actualizado).toEqual({ id: 1, nombre: "Ana Pérez", email: "ana@mail.com", telefono: "1166660000" });
    expect(await useCases.obtenerCliente(1)).toEqual(actualizado);
  });

  it("permite borrar el teléfono enviándolo en null", async () => {
    expect((await useCases.actualizarCliente(1, { telefono: null })).telefono).toBeNull();
  });

  it("actualización con email de otro cliente: lanza 409 EMAIL_DUPLICADO y no modifica nada", async () => {
    await expect(useCases.actualizarCliente(2, { email: "ANA@mail.com", nombre: "Otro" })).rejects.toMatchObject({
      code: "EMAIL_DUPLICADO",
      statusCode: 409,
    });

    expect(await useCases.obtenerCliente(2)).toMatchObject({ nombre: "Luis Sosa", email: "luis@mail.com" });
  });

  it("actualización conservando el propio email: permite cambiar otros campos", async () => {
    const actualizado = await useCases.actualizarCliente(1, { email: "ana@mail.com", nombre: "Ana P. Gómez" });

    expect(actualizado.nombre).toBe("Ana P. Gómez");
  });

  it("actualizar inexistente: lanza 404 CLIENTE_NO_ENCONTRADO", async () => {
    await expect(useCases.actualizarCliente(999, { nombre: "Nadie" })).rejects.toMatchObject({
      code: "CLIENTE_NO_ENCONTRADO",
      statusCode: 404,
    });
  });

  it("ignora un id incluido en los cambios", async () => {
    const actualizado = await useCases.actualizarCliente(1, { id: 50, nombre: "Ana" });

    expect(actualizado.id).toBe(1);
    await expect(useCases.obtenerCliente(50)).rejects.toMatchObject({ code: "CLIENTE_NO_ENCONTRADO" });
  });
});
