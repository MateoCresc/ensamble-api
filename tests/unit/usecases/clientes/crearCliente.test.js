import { describe, it, expect, beforeEach } from "vitest";
import { makeClientesUseCases } from "../../../../usecases/clientes/makeClientesUseCases.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";
import { AppError } from "../../../../errors/AppError.js";

// Spec clientes — requisitos "Alta de cliente" y "Email único".
// Cada test arma sus casos de uso con un DAO en memoria nuevo (AGENTS.md §4).
describe("crearCliente", () => {
  let useCases;

  beforeEach(() => {
    useCases = makeClientesUseCases({ clientesDao: new ClientesMemoryDao() });
  });

  it("cliente creado: asigna un id entero y deja telefono en null si no se envía", async () => {
    const cliente = await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });

    expect(cliente).toEqual({ id: 1, nombre: "Ana Pérez", email: "ana@mail.com", telefono: null });
  });

  it("cliente creado: conserva el telefono cuando se envía", async () => {
    const cliente = await useCases.crearCliente({
      nombre: "Luis Sosa",
      email: "luis@mail.com",
      telefono: "1155550000",
    });

    expect(cliente.telefono).toBe("1155550000");
  });

  it("cliente creado: asigna ids consecutivos", async () => {
    const primero = await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });
    const segundo = await useCases.crearCliente({ nombre: "Luis Sosa", email: "luis@mail.com" });

    expect([primero.id, segundo.id]).toEqual([1, 2]);
  });

  it("id enviado por el cliente: se ignora y el sistema asigna uno propio", async () => {
    const cliente = await useCases.crearCliente({ id: 99, nombre: "Ana Pérez", email: "ana@mail.com" });

    expect(cliente.id).toBe(1);
  });

  it("alta con email repetido: lanza 409 EMAIL_DUPLICADO sin distinguir mayúsculas", async () => {
    await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });

    const intento = useCases.crearCliente({ nombre: "Otra Ana", email: "ANA@mail.com" });

    await expect(intento).rejects.toBeInstanceOf(AppError);
    await expect(intento).rejects.toMatchObject({ code: "EMAIL_DUPLICADO", statusCode: 409 });
  });

  it("alta con email repetido: no guarda el segundo cliente", async () => {
    await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });
    await useCases.crearCliente({ nombre: "Otra Ana", email: "ana@mail.com" }).catch(() => {});

    await expect(useCases.obtenerCliente(2)).rejects.toMatchObject({ code: "CLIENTE_NO_ENCONTRADO" });
  });
});
