import { describe, it, expect, beforeEach } from "vitest";
import { makeMaterialesUseCases } from "../../../../usecases/materiales/makeMaterialesUseCases.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";

// Spec materiales — requisito "Baja de material".
describe("eliminarMaterial", () => {
  let useCases;

  beforeEach(async () => {
    useCases = makeMaterialesUseCases({ materialesDao: new MaterialesMemoryDao() });
    await useCases.crearMaterial({ nombre: "Tablón de pino", unidad: "m" });
  });

  it("material eliminado: ya no se puede obtener y libera el nombre", async () => {
    await useCases.eliminarMaterial(1);

    await expect(useCases.obtenerMaterial(1)).rejects.toMatchObject({ code: "MATERIAL_NO_ENCONTRADO" });
    await expect(useCases.crearMaterial({ nombre: "Tablón de pino", unidad: "m" })).resolves.toMatchObject({ id: 2 });
  });

  it("eliminar inexistente: 404 MATERIAL_NO_ENCONTRADO", async () => {
    await expect(useCases.eliminarMaterial(999)).rejects.toMatchObject({ code: "MATERIAL_NO_ENCONTRADO", statusCode: 404 });
  });
});
