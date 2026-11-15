import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";

// Spec encargos — requisito "Alta de encargo".
describe("crearEncargo", () => {
  let e;

  beforeEach(async () => {
    e = await escenarioEncargos();
  });

  it("encargo creado: presupuestado, con cliente y materiales con nombre, unidad y cantidad", async () => {
    const encargo = await e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Mesa de comedor",
      fechaEntregaEstimada: "2026-12-20",
      materiales: [{ materialId: e.pino.id, cantidad: 4.5 }],
    });

    expect(encargo).toEqual({
      id: 1,
      clienteId: 1,
      cliente: { id: 1, nombre: "Ana Pérez" },
      descripcion: "Mesa de comedor",
      estado: "presupuestado",
      fechaEntregaEstimada: "2026-12-20",
      materiales: [{ materialId: 1, nombre: "Tablón de pino", unidad: "m", cantidad: 4.5 }],
    });
  });

  it("encargo sin materiales: materiales vacío y fecha en null", async () => {
    const encargo = await e.useCases.crearEncargo({ clienteId: e.luis.id, descripcion: "Reja de ventana" });

    expect(encargo).toMatchObject({ materiales: [], fechaEntregaEstimada: null, estado: "presupuestado" });
  });

  it("materiales ordenados por materialId", async () => {
    const encargo = await e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Banco",
      materiales: [
        { materialId: e.canio.id, cantidad: 1 },
        { materialId: e.pino.id, cantidad: 2 },
      ],
    });

    expect(encargo.materiales.map((m) => m.materialId)).toEqual([1, 2]);
  });

  it("cliente inexistente: 404 CLIENTE_NO_ENCONTRADO", async () => {
    await expect(e.useCases.crearEncargo({ clienteId: 999, descripcion: "Nada" })).rejects.toMatchObject({
      code: "CLIENTE_NO_ENCONTRADO",
      statusCode: 404,
    });
  });

  it("material inexistente: 404 MATERIAL_NO_ENCONTRADO con los ids inexistentes y sin crear nada", async () => {
    const intento = e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Mesa",
      materiales: [
        { materialId: e.pino.id, cantidad: 1 },
        { materialId: 98, cantidad: 1 },
        { materialId: 99, cantidad: 1 },
      ],
    });

    await expect(intento).rejects.toMatchObject({
      code: "MATERIAL_NO_ENCONTRADO",
      statusCode: 404,
      details: { ids: [98, 99] },
    });
    expect(await e.useCases.listarEncargos()).toEqual([]);
  });
});
