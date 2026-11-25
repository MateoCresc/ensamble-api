import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";

// Spec encargos — requisito "Modificación de encargo presupuestado".
describe("actualizarEncargo", () => {
  let e;

  beforeEach(async () => {
    e = await escenarioEncargos();
    await e.useCases.crearEncargo({
      clienteId: e.ana.id,
      descripcion: "Mesa",
      materiales: [{ materialId: e.pino.id, cantidad: 4 }],
    });
  });

  it("reemplazo de materiales: la lista enviada reemplaza a la anterior", async () => {
    const actualizado = await e.useCases.actualizarEncargo(1, { materiales: [{ materialId: e.canio.id, cantidad: 3 }] });

    expect(actualizado.materiales).toEqual([{ materialId: 2, nombre: "Caño de hierro", unidad: "m", cantidad: 3 }]);
    expect(actualizado.descripcion).toBe("Mesa");
  });

  it("actualización parcial de descripción y fecha sin tocar materiales", async () => {
    const actualizado = await e.useCases.actualizarEncargo(1, { descripcion: "Mesa extensible", fechaEntregaEstimada: null });

    expect(actualizado).toMatchObject({ descripcion: "Mesa extensible", fechaEntregaEstimada: null });
    expect(actualizado.materiales).toHaveLength(1);
  });

  it("material inexistente en el reemplazo: 404 MATERIAL_NO_ENCONTRADO", async () => {
    await expect(
      e.useCases.actualizarEncargo(1, { materiales: [{ materialId: 77, cantidad: 1 }] })
    ).rejects.toMatchObject({ code: "MATERIAL_NO_ENCONTRADO", details: { ids: [77] } });
  });

  it("encargo ya confirmado: 409 ENCARGO_NO_EDITABLE", async () => {
    await e.encargosDao.cambiarEstado(1, { desde: ["presupuestado"], hacia: "confirmado" });

    await expect(e.useCases.actualizarEncargo(1, { descripcion: "Otra cosa" })).rejects.toMatchObject({
      code: "ENCARGO_NO_EDITABLE",
      statusCode: 409,
    });
  });

  it("encargo inexistente: 404 ENCARGO_NO_ENCONTRADO", async () => {
    await expect(e.useCases.actualizarEncargo(999, { descripcion: "x" })).rejects.toMatchObject({
      code: "ENCARGO_NO_ENCONTRADO",
    });
  });
});
