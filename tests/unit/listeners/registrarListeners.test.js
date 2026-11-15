import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "node:events";
import { registrarListeners } from "../../../listeners/registrarListeners.js";
import { EVENTOS } from "../../../events/eventNames.js";

// Spec notificaciones — los listeners traducen eventos a avisos y aíslan las fallas del canal.
const esperarListeners = () => new Promise((resolve) => setImmediate(resolve));

describe("registrarListeners", () => {
  let bus;
  let avisosEncargos;
  let avisosStock;

  beforeEach(() => {
    bus = new EventEmitter();
    avisosEncargos = [];
    avisosStock = [];
    registrarListeners(bus, {
      encargos: { notificar: async (aviso) => avisosEncargos.push(aviso) },
      stock: { notificar: async (aviso) => avisosStock.push(aviso) },
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("aviso de encargo confirmado por el canal de encargos", async () => {
    bus.emit(EVENTOS.ENCARGO_CONFIRMADO, { encargoId: 1, cliente: { id: 1, nombre: "Ana Pérez" }, cantidadMateriales: 2 });
    await esperarListeners();

    expect(avisosEncargos).toHaveLength(1);
    expect(avisosEncargos[0].asunto).toBe("Encargo confirmado");
    expect(avisosEncargos[0].mensaje).toMatch(/#1/);
    expect(avisosEncargos[0].mensaje).toMatch(/Ana Pérez/);
    expect(avisosStock).toEqual([]);
  });

  it("usa singular cuando el encargo tiene un solo material", async () => {
    bus.emit(EVENTOS.ENCARGO_CONFIRMADO, { encargoId: 3, cliente: { id: 1, nombre: "Ana Pérez" }, cantidadMateriales: 1 });
    await esperarListeners();

    expect(avisosEncargos[0].mensaje).toMatch(/\(1 material\)$/);
  });

  it("aviso de stock bajo por el canal de stock, con nombre, stock y mínimo", async () => {
    bus.emit(EVENTOS.MATERIAL_STOCK_BAJO, { materialId: 1, nombre: "Tablón de pino", unidad: "m", stock: 2, stockMinimo: 3 });
    await esperarListeners();

    expect(avisosStock).toHaveLength(1);
    expect(avisosStock[0].asunto).toBe("Stock bajo");
    expect(avisosStock[0].mensaje).toMatch(/Tablón de pino/);
    expect(avisosStock[0].mensaje).toMatch(/2 m/);
    expect(avisosStock[0].mensaje).toMatch(/mínimo 3/);
  });

  it("falla de aviso aislada: el listener captura el error y lo registra en la consola de errores", async () => {
    const otroBus = new EventEmitter();
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    registrarListeners(otroBus, {
      encargos: { notificar: async () => Promise.reject(new Error("canal caído")) },
      stock: { notificar: async () => {} },
    });

    expect(() =>
      otroBus.emit(EVENTOS.ENCARGO_CONFIRMADO, { encargoId: 1, cliente: { id: 1, nombre: "Ana" }, cantidadMateriales: 1 })
    ).not.toThrow();
    await esperarListeners();

    expect(consola).toHaveBeenCalledWith(expect.stringContaining("No se pudo notificar"), "canal caído");
  });
});
