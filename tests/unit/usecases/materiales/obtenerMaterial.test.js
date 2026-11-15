import { describe, it, expect, beforeEach } from "vitest";
import { makeMaterialesUseCases } from "../../../../usecases/materiales/makeMaterialesUseCases.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";
import { AppError } from "../../../../errors/AppError.js";

// Spec materiales — requisito "Consulta de material por id".
describe("obtenerMaterial", () => {
  let useCases;

  beforeEach(() => {
    useCases = makeMaterialesUseCases({ materialesDao: new MaterialesMemoryDao() });
  });

  it("material existente: devuelve sus datos", async () => {
    const creado = await useCases.crearMaterial({ nombre: "Caño de hierro", unidad: "m", stock: 10 });

    expect(await useCases.obtenerMaterial(creado.id)).toEqual(creado);
  });

  it("material inexistente: 404 MATERIAL_NO_ENCONTRADO", async () => {
    const intento = useCases.obtenerMaterial(999);

    await expect(intento).rejects.toBeInstanceOf(AppError);
    await expect(intento).rejects.toMatchObject({ code: "MATERIAL_NO_ENCONTRADO", statusCode: 404 });
  });

  it("devuelve una copia: modificar el resultado no altera el material guardado", async () => {
    const creado = await useCases.crearMaterial({ nombre: "Caño de hierro", unidad: "m", stock: 10 });

    (await useCases.obtenerMaterial(creado.id)).stock = -1;

    expect((await useCases.obtenerMaterial(creado.id)).stock).toBe(10);
  });
});
