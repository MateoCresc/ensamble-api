import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";

// Spec encargos — requisitos "Confirmación con descuento de stock", "Cancelación con reposición de stock",
// "Avance de producción" y "Transiciones inválidas".
describe("ciclo de vida de un encargo", () => {
  let e;
  const stock = async (material) => (await e.materialesDao.getById(material.id)).stock;
  const crear = (materiales) =>
    e.useCases.crearEncargo({ clienteId: e.ana.id, descripcion: "Mesa de comedor", materiales });

  beforeEach(async () => {
    e = await escenarioEncargos(); // pino: stock 12.5 · caño: stock 3
  });

  describe("confirmarEncargo", () => {
    it("confirmación exitosa: pasa a confirmado y descuenta el stock", async () => {
      await crear([{ materialId: e.pino.id, cantidad: 4.5 }]);

      const confirmado = await e.useCases.confirmarEncargo(1);

      expect(confirmado.estado).toBe("confirmado");
      expect(await stock(e.pino)).toBe(8);
    });

    it("descuenta sin errores de coma flotante (redondeo a 2 decimales)", async () => {
      const lija = await e.materialesDao.save({ nombre: "Lija", unidad: "unidad", stock: 0.3 });
      await crear([{ materialId: lija.id, cantidad: 0.1 }]);

      await e.useCases.confirmarEncargo(1);

      expect(await stock(lija)).toBe(0.2);
    });

    it("stock insuficiente: 409 con el detalle por material y sin modificar nada", async () => {
      await crear([
        { materialId: e.pino.id, cantidad: 2 },
        { materialId: e.canio.id, cantidad: 5 },
      ]);

      await expect(e.useCases.confirmarEncargo(1)).rejects.toMatchObject({
        code: "STOCK_INSUFICIENTE",
        statusCode: 409,
        details: [{ materialId: 2, nombre: "Caño de hierro", requerido: 5, disponible: 3 }],
      });
      expect(await stock(e.pino)).toBe(12.5);
      expect(await stock(e.canio)).toBe(3);
      expect((await e.useCases.obtenerEncargo(1)).estado).toBe("presupuestado");
    });

    it("usa exactamente todo el stock disponible", async () => {
      await crear([{ materialId: e.canio.id, cantidad: 3 }]);

      await e.useCases.confirmarEncargo(1);

      expect(await stock(e.canio)).toBe(0);
    });

    it("encargo sin materiales: 409 ENCARGO_SIN_MATERIALES", async () => {
      await crear([]);

      await expect(e.useCases.confirmarEncargo(1)).rejects.toMatchObject({
        code: "ENCARGO_SIN_MATERIALES",
        statusCode: 409,
      });
    });
  });

  describe("cancelarEncargo", () => {
    it("cancelar un confirmado: pasa a cancelado y repone el stock", async () => {
      await crear([{ materialId: e.pino.id, cantidad: 4.5 }]);
      await e.useCases.confirmarEncargo(1);

      const cancelado = await e.useCases.cancelarEncargo(1);

      expect(cancelado.estado).toBe("cancelado");
      expect(await stock(e.pino)).toBe(12.5);
    });

    it("cancelar un presupuesto: pasa a cancelado sin tocar stock", async () => {
      await crear([{ materialId: e.pino.id, cantidad: 4.5 }]);

      expect((await e.useCases.cancelarEncargo(1)).estado).toBe("cancelado");
      expect(await stock(e.pino)).toBe(12.5);
    });
  });

  describe("avance de producción", () => {
    it("recorrido completo: confirmar → iniciar → entregar, sin volver a tocar stock", async () => {
      await crear([{ materialId: e.pino.id, cantidad: 2 }]);
      await e.useCases.confirmarEncargo(1);

      expect((await e.useCases.iniciarEncargo(1)).estado).toBe("en_produccion");
      expect((await e.useCases.entregarEncargo(1)).estado).toBe("entregado");
      expect(await stock(e.pino)).toBe(10.5);
    });
  });

  describe("transiciones inválidas", () => {
    beforeEach(async () => {
      await crear([{ materialId: e.pino.id, cantidad: 2 }]);
    });

    it("confirmar dos veces: 409 TRANSICION_INVALIDA y el stock no se descuenta de nuevo", async () => {
      await e.useCases.confirmarEncargo(1);

      await expect(e.useCases.confirmarEncargo(1)).rejects.toMatchObject({
        code: "TRANSICION_INVALIDA",
        statusCode: 409,
        details: { estadoActual: "confirmado", accion: "confirmar" },
      });
      expect(await stock(e.pino)).toBe(10.5);
    });

    it("iniciar un presupuestado: 409 TRANSICION_INVALIDA", async () => {
      await expect(e.useCases.iniciarEncargo(1)).rejects.toMatchObject({ code: "TRANSICION_INVALIDA" });
    });

    it("cancelar un entregado: 409 TRANSICION_INVALIDA", async () => {
      await e.useCases.confirmarEncargo(1);
      await e.useCases.iniciarEncargo(1);
      await e.useCases.entregarEncargo(1);

      await expect(e.useCases.cancelarEncargo(1)).rejects.toMatchObject({
        code: "TRANSICION_INVALIDA",
        details: { estadoActual: "entregado", accion: "cancelar" },
      });
    });

    it("confirmar un cancelado: 409 TRANSICION_INVALIDA", async () => {
      await e.useCases.cancelarEncargo(1);

      await expect(e.useCases.confirmarEncargo(1)).rejects.toMatchObject({ code: "TRANSICION_INVALIDA" });
    });

    it("acción sobre un encargo inexistente: 404 ENCARGO_NO_ENCONTRADO", async () => {
      await expect(e.useCases.entregarEncargo(999)).rejects.toMatchObject({ code: "ENCARGO_NO_ENCONTRADO" });
    });
  });
});
