import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";

// Spec encargos — requisito "Consulta de encargo por id".
describe("obtenerEncargo", () => {
  let e;

  beforeEach(async () => {
    e = await escenarioEncargos();
  });

  it("encargo existente: devuelve estado, cliente y materiales", async () => {
    const creado = await e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Mesa",
      materiales: [{ materialId: e.pino.id, cantidad: 2 }],
    });

    expect(await e.useCases.obtenerEncargo(creado.id)).toEqual(creado);
  });

  it("refleja datos actuales del cliente y del material", async () => {
    const creado = await e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Mesa",
      materiales: [{ materialId: e.pino.id, cantidad: 2 }],
    });
    await e.clientesDao.update(e.ana.id, { nombre: "Ana P. Gómez" });

    expect((await e.useCases.obtenerEncargo(creado.id)).cliente.nombre).toBe("Ana P. Gómez");
  });

  it("encargo inexistente: 404 ENCARGO_NO_ENCONTRADO", async () => {
    await expect(e.useCases.obtenerEncargo(999)).rejects.toMatchObject({
      code: "ENCARGO_NO_ENCONTRADO",
      statusCode: 404,
    });
  });
});
