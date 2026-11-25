import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";
import { EVENTOS } from "../../../../events/eventNames.js";

// Spec notificaciones — el caso de uso emite los hechos; quién los escucha es otro módulo.
describe("eventos emitidos al confirmar un encargo", () => {
  let e;
  let emitidos;

  beforeEach(async () => {
    e = await escenarioEncargos(); // pino: stock 12.5, mínimo 3 · caño: stock 3, mínimo 1
    emitidos = [];
    for (const nombre of Object.values(EVENTOS)) e.eventBus.on(nombre, (datos) => emitidos.push({ nombre, datos }));
  });

  const crearYConfirmar = async (materiales) => {
    await e.useCases.crearEncargo({ clienteId: e.ana.id, descripcion: "Mesa", materiales });
    return e.useCases.confirmarEncargo(1);
  };

  it("emite encargo.confirmado con el encargo, el cliente y la cantidad de materiales", async () => {
    await crearYConfirmar([
      { materialId: e.pino.id, cantidad: 1 },
      { materialId: e.canio.id, cantidad: 1 },
    ]);

    expect(emitidos.filter((x) => x.nombre === "encargo.confirmado")).toEqual([
      {
        nombre: "encargo.confirmado",
        datos: { encargoId: 1, cliente: { id: 1, nombre: "Ana Pérez" }, cantidadMateriales: 2 },
      },
    ]);
  });

  it("emite material.stockBajo solo por los materiales que quedan en o bajo su mínimo", async () => {
    await crearYConfirmar([
      { materialId: e.pino.id, cantidad: 10 }, // 12.5 → 2.5 (mínimo 3): avisa
      { materialId: e.canio.id, cantidad: 1 }, // 3 → 2 (mínimo 1): no avisa
    ]);

    expect(emitidos.filter((x) => x.nombre === "material.stockBajo").map((x) => x.datos)).toEqual([
      { materialId: 1, nombre: "Tablón de pino", unidad: "m", stock: 2.5, stockMinimo: 3 },
    ]);
  });

  it("stock exactamente igual al mínimo también avisa", async () => {
    await crearYConfirmar([{ materialId: e.canio.id, cantidad: 2 }]); // 3 → 1 (mínimo 1)

    expect(emitidos.some((x) => x.nombre === "material.stockBajo" && x.datos.materialId === 2)).toBe(true);
  });

  it("si la confirmación falla no se emite nada", async () => {
    await expect(crearYConfirmar([{ materialId: e.canio.id, cantidad: 50 }])).rejects.toMatchObject({
      code: "STOCK_INSUFICIENTE",
    });

    expect(emitidos).toEqual([]);
  });

  it("cancelar no emite eventos de confirmación", async () => {
    await crearYConfirmar([{ materialId: e.pino.id, cantidad: 1 }]);
    emitidos = [];

    await e.useCases.cancelarEncargo(1);

    expect(emitidos).toEqual([]);
  });
});
