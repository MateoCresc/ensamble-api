import { describe, it, expect, beforeEach } from "vitest";
import { createDaos } from "../../../dao/daoFactory.js";
import { MODOS_PERSISTENCIA } from "../../helpers/buildTestApp.js";

// Contrato del DAO de materiales en ambos adaptadores (design D3, D4, D5).
describe.each(MODOS_PERSISTENCIA)("DAO de materiales (%s)", (persistenceType) => {
  let dao;

  beforeEach(async () => {
    ({ materialesDao: dao } = await createDaos({ persistenceType, dbStorage: ":memory:" }));
  });

  it("save aplica defaults y devuelve stock como número, sin exponer columnas internas", async () => {
    const material = await dao.save({ nombre: "Tablón de pino", unidad: "m", stock: 12.5 });

    expect(material).toEqual({ id: 1, nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 0 });
    expect(typeof material.stock).toBe("number");
  });

  it("getByNombre no distingue mayúsculas (incluidas letras acentuadas) ni espacios en los extremos", async () => {
    await dao.save({ nombre: "Tablón de pino", unidad: "m" });

    expect(await dao.getByNombre("  TABLÓN DE PINO ")).toMatchObject({ id: 1 });
    expect(await dao.getByNombre("Tablón")).toBeNull();
  });

  it("update cambia el nombre y la búsqueda por nombre lo refleja", async () => {
    await dao.save({ nombre: "Tablón de pino", unidad: "m", stock: 2 });

    const actualizado = await dao.update(1, { nombre: "Tablón de eucalipto", stock: 20.75 });

    expect(actualizado).toEqual({ id: 1, nombre: "Tablón de eucalipto", unidad: "m", stock: 20.75, stockMinimo: 0 });
    expect(await dao.getByNombre("tablón de pino")).toBeNull();
    expect(await dao.getByNombre("tablón de eucalipto")).toMatchObject({ id: 1 });
  });

  it("getAll ordena por id y delete devuelve true/false", async () => {
    await dao.save({ nombre: "Clavos", unidad: "kg" });
    await dao.save({ nombre: "Barniz", unidad: "l" });

    expect((await dao.getAll()).map((m) => m.nombre)).toEqual(["Clavos", "Barniz"]);
    expect(await dao.delete(2)).toBe(true);
    expect(await dao.delete(2)).toBe(false);
  });
});

describe("DAO de materiales en Sequelize: unicidad respaldada por la base", () => {
  it("dos altas con el mismo nombre normalizado: la segunda falla con 409 MATERIAL_DUPLICADO", async () => {
    const { materialesDao } = await createDaos({ persistenceType: "sequelize", dbStorage: ":memory:" });
    await materialesDao.save({ nombre: "Tablón de pino", unidad: "m" });

    await expect(materialesDao.save({ nombre: " TABLÓN DE PINO ", unidad: "m" })).rejects.toMatchObject({
      code: "MATERIAL_DUPLICADO",
      statusCode: 409,
    });
  });
});
