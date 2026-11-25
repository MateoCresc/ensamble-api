import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";

// Spec encargos — requisito "Baja de encargo".
describe("eliminarEncargo", () => {
  let e;

  beforeEach(async () => {
    e = await escenarioEncargos();
    await e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Mesa",
      materiales: [{ materialId: e.pino.id, cantidad: 1 }],
    });
  });

  it("baja de presupuesto: ya no se puede obtener", async () => {
    await e.useCases.eliminarEncargo(1);

    await expect(e.useCases.obtenerEncargo(1)).rejects.toMatchObject({ code: "ENCARGO_NO_ENCONTRADO" });
  });

  it("baja de encargo cancelado: permitida", async () => {
    await e.encargosDao.cambiarEstado(1, { desde: ["presupuestado"], hacia: "cancelado" });

    await expect(e.useCases.eliminarEncargo(1)).resolves.toBeUndefined();
  });

  it("baja de encargo confirmado: 409 ENCARGO_NO_ELIMINABLE y el encargo sigue", async () => {
    await e.encargosDao.cambiarEstado(1, { desde: ["presupuestado"], hacia: "confirmado" });

    await expect(e.useCases.eliminarEncargo(1)).rejects.toMatchObject({ code: "ENCARGO_NO_ELIMINABLE", statusCode: 409 });
    expect((await e.useCases.obtenerEncargo(1)).estado).toBe("confirmado");
  });

  it("baja de inexistente: 404 ENCARGO_NO_ENCONTRADO", async () => {
    await expect(e.useCases.eliminarEncargo(999)).rejects.toMatchObject({ code: "ENCARGO_NO_ENCONTRADO" });
  });
});
