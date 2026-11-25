import { describe, it, expect, beforeEach } from "vitest";
import { makeMaterialesUseCases } from "../../../../usecases/materiales/makeMaterialesUseCases.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";
import { EncargosMemoryDao } from "../../../../dao/encargos/encargos.memory.dao.js";

// Spec materiales — requisitos "Baja de material" y "Material en uso no eliminable".
describe("eliminarMaterial", () => {
  let useCases;
  let encargosDao;

  beforeEach(async () => {
    const materialesDao = new MaterialesMemoryDao();
    encargosDao = new EncargosMemoryDao({ clientesDao: new ClientesMemoryDao(), materialesDao });
    useCases = makeMaterialesUseCases({ materialesDao, encargosDao });
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

  it("baja de material usado: 409 MATERIAL_EN_USO y el material sigue existiendo", async () => {
    await encargosDao.save({ clienteId: 1, descripcion: "Mesa", materiales: [{ materialId: 1, cantidad: 2 }] });

    await expect(useCases.eliminarMaterial(1)).rejects.toMatchObject({ code: "MATERIAL_EN_USO", statusCode: 409 });
    expect(await useCases.obtenerMaterial(1)).toMatchObject({ id: 1 });
  });
});
