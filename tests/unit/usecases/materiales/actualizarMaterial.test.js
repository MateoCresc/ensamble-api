import { describe, it, expect, beforeEach } from "vitest";
import { makeMaterialesUseCases } from "../../../../usecases/materiales/makeMaterialesUseCases.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";

// Spec materiales — requisitos "Modificación de material" y "Nombre único de material".
describe("actualizarMaterial", () => {
  let useCases;

  beforeEach(async () => {
    useCases = makeMaterialesUseCases({ materialesDao: new MaterialesMemoryDao() });
    await useCases.crearMaterial({ nombre: "Tablón de pino", unidad: "m", stock: 2, stockMinimo: 5 });
    await useCases.crearMaterial({ nombre: "Caño de hierro", unidad: "m", stock: 10 });
  });

  it("reposición de stock: cambia solo el stock", async () => {
    const actualizado = await useCases.actualizarMaterial(1, { stock: 20 });

    expect(actualizado).toEqual({ id: 1, nombre: "Tablón de pino", unidad: "m", stock: 20, stockMinimo: 5 });
    expect(await useCases.obtenerMaterial(1)).toEqual(actualizado);
  });

  it("actualización con el nombre de otro material: 409 MATERIAL_DUPLICADO y no modifica nada", async () => {
    await expect(useCases.actualizarMaterial(2, { nombre: "tablón de pino", stock: 1 })).rejects.toMatchObject({
      code: "MATERIAL_DUPLICADO",
      statusCode: 409,
    });

    expect(await useCases.obtenerMaterial(2)).toMatchObject({ nombre: "Caño de hierro", stock: 10 });
  });

  it("permite conservar el propio nombre cambiando mayúsculas", async () => {
    expect((await useCases.actualizarMaterial(1, { nombre: "TABLÓN DE PINO" })).nombre).toBe("TABLÓN DE PINO");
  });

  it("actualizar inexistente: 404 MATERIAL_NO_ENCONTRADO", async () => {
    await expect(useCases.actualizarMaterial(999, { stock: 1 })).rejects.toMatchObject({
      code: "MATERIAL_NO_ENCONTRADO",
      statusCode: 404,
    });
  });
});
