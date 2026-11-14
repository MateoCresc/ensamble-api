import { describe, it, expect, beforeEach } from "vitest";
import { makeMaterialesUseCases } from "../../../../usecases/materiales/makeMaterialesUseCases.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";

// Spec materiales — requisitos "Listado de materiales" y "Orden y paginación de materiales".
describe("listarMateriales", () => {
  let useCases;
  const nombres = (materiales) => materiales.map((m) => m.nombre);

  beforeEach(async () => {
    useCases = makeMaterialesUseCases({ materialesDao: new MaterialesMemoryDao() });
    await useCases.crearMaterial({ nombre: "Tablón de pino", unidad: "m", stock: 2, stockMinimo: 5 });
    await useCases.crearMaterial({ nombre: "Caño de hierro", unidad: "m", stock: 10, stockMinimo: 2 });
    await useCases.crearMaterial({ nombre: "Clavos", unidad: "kg", stock: 3, stockMinimo: 3 });
    await useCases.crearMaterial({ nombre: "Barniz marino", unidad: "l", stock: 7.25 });
  });

  it("listado completo ordenado por id", async () => {
    expect((await useCases.listarMateriales()).map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });

  it("filtro por nombre parcial sin distinguir mayúsculas", async () => {
    expect(nombres(await useCases.listarMateriales({ nombre: "IN" }))).toEqual(["Tablón de pino", "Barniz marino"]);
  });

  it("filtro por unidad exacta", async () => {
    expect(nombres(await useCases.listarMateriales({ unidad: "kg" }))).toEqual(["Clavos"]);
  });

  it("filtro por bajo stock: stock menor o igual al mínimo", async () => {
    expect(nombres(await useCases.listarMateriales({ bajoStock: true }))).toEqual(["Tablón de pino", "Clavos"]);
  });

  it("bajoStock false: los que están por encima del mínimo", async () => {
    expect(nombres(await useCases.listarMateriales({ bajoStock: false }))).toEqual(["Caño de hierro", "Barniz marino"]);
  });

  it("orden por stock descendente", async () => {
    expect(nombres(await useCases.listarMateriales({ sort: "-stock" }))).toEqual([
      "Caño de hierro",
      "Barniz marino",
      "Clavos",
      "Tablón de pino",
    ]);
  });

  it("orden por nombre ascendente respetando acentos", async () => {
    expect(nombres(await useCases.listarMateriales({ sort: "nombre" }))).toEqual([
      "Barniz marino",
      "Caño de hierro",
      "Clavos",
      "Tablón de pino",
    ]);
  });

  it("página de materiales: page 2 con limit 2 devuelve el 3.º y el 4.º", async () => {
    expect((await useCases.listarMateriales({ page: 2, limit: 2 })).map((m) => m.id)).toEqual([3, 4]);
  });
});
