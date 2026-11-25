import { describe, it, expect, beforeEach } from "vitest";
import { createDaos } from "../../../dao/daoFactory.js";
import { MODOS_PERSISTENCIA } from "../../helpers/buildTestApp.js";

// Contrato del DAO de encargos en ambos adaptadores (design D1, D2, D4, D5 de encargos).
describe.each(MODOS_PERSISTENCIA)("DAO de encargos (%s)", (persistenceType) => {
  let daos;
  const stock = async (id) => (await daos.materialesDao.getById(id)).stock;
  const estado = async (id) => (await daos.encargosDao.getById(id)).estado;

  beforeEach(async () => {
    daos = await createDaos({ persistenceType, dbStorage: ":memory:" });
    await daos.clientesDao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });
    await daos.materialesDao.save({ nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 });
    await daos.materialesDao.save({ nombre: "Caño de hierro", unidad: "m", stock: 3 });
    await daos.encargosDao.save({
      clienteId: 1,
      descripcion: "Mesa de comedor",
      fechaEntregaEstimada: "2026-12-20",
      materiales: [
        { materialId: 2, cantidad: 1 },
        { materialId: 1, cantidad: 4.5 },
      ],
    });
  });

  it("save/getById: forma plana con cliente y materiales ordenados por materialId", async () => {
    const encargo = await daos.encargosDao.getById(1);

    expect(encargo).toEqual({
      id: 1,
      clienteId: 1,
      cliente: { id: 1, nombre: "Ana Pérez" },
      descripcion: "Mesa de comedor",
      estado: "presupuestado",
      fechaEntregaEstimada: "2026-12-20",
      materiales: [
        { materialId: 1, nombre: "Tablón de pino", unidad: "m", cantidad: 4.5 },
        { materialId: 2, nombre: "Caño de hierro", unidad: "m", cantidad: 1 },
      ],
    });
    expect(await daos.encargosDao.getById(99)).toBeNull();
  });

  it("save sin materiales ni fecha: materiales vacío y fecha null", async () => {
    const encargo = await daos.encargosDao.save({ clienteId: 1, descripcion: "Reja" });

    expect(encargo).toMatchObject({ id: 2, materiales: [], fechaEntregaEstimada: null });
  });

  it("update reemplaza la lista de materiales y cambia solo los campos enviados", async () => {
    const actualizado = await daos.encargosDao.update(1, { materiales: [{ materialId: 2, cantidad: 2.25 }] });

    expect(actualizado.materiales).toEqual([{ materialId: 2, nombre: "Caño de hierro", unidad: "m", cantidad: 2.25 }]);
    expect(actualizado.descripcion).toBe("Mesa de comedor");
    expect(await daos.encargosDao.update(99, { descripcion: "x" })).toBeNull();
  });

  it("getAll devuelve los encargos con relaciones ordenados por id", async () => {
    await daos.encargosDao.save({ clienteId: 1, descripcion: "Reja" });

    const encargos = await daos.encargosDao.getAll();

    expect(encargos.map((e) => e.descripcion)).toEqual(["Mesa de comedor", "Reja"]);
    expect(encargos[0].materiales).toHaveLength(2);
  });

  it("cambiarEstado aplica estado y stock juntos, redondeando a 2 decimales", async () => {
    const confirmado = await daos.encargosDao.cambiarEstado(1, {
      desde: ["presupuestado"],
      hacia: "confirmado",
      movimientos: [
        { materialId: 1, delta: -4.5 },
        { materialId: 2, delta: -1 },
      ],
    });

    expect(confirmado.estado).toBe("confirmado");
    expect(await stock(1)).toBe(8);
    expect(await stock(2)).toBe(2);
  });

  it("cambiarEstado es atómico: si un material no alcanza, no cambia ningún stock ni el estado", async () => {
    const resultado = await daos.encargosDao.cambiarEstado(1, {
      desde: ["presupuestado"],
      hacia: "confirmado",
      movimientos: [
        { materialId: 1, delta: -4.5 },
        { materialId: 2, delta: -10 },
      ],
    });

    expect(resultado).toBeNull();
    expect(await stock(1)).toBe(12.5);
    expect(await stock(2)).toBe(3);
    expect(await estado(1)).toBe("presupuestado");
  });

  it("cambiarEstado devuelve null sin tocar stock si el estado ya no es el esperado", async () => {
    const resultado = await daos.encargosDao.cambiarEstado(1, {
      desde: ["confirmado"],
      hacia: "cancelado",
      movimientos: [{ materialId: 1, delta: 4.5 }],
    });

    expect(resultado).toBeNull();
    expect(await stock(1)).toBe(12.5);
  });

  it("cambiarEstado con movimientos positivos repone stock", async () => {
    await daos.encargosDao.cambiarEstado(1, { desde: ["presupuestado"], hacia: "confirmado", movimientos: [{ materialId: 1, delta: -4.5 }] });

    await daos.encargosDao.cambiarEstado(1, { desde: ["confirmado"], hacia: "cancelado", movimientos: [{ materialId: 1, delta: 4.5 }] });

    expect(await stock(1)).toBe(12.5);
    expect(await estado(1)).toBe("cancelado");
  });

  it("existePorCliente y existePorMaterial", async () => {
    expect(await daos.encargosDao.existePorCliente(1)).toBe(true);
    expect(await daos.encargosDao.existePorCliente(2)).toBe(false);
    expect(await daos.encargosDao.existePorMaterial(2)).toBe(true);
    await daos.materialesDao.save({ nombre: "Clavos", unidad: "kg" });
    expect(await daos.encargosDao.existePorMaterial(3)).toBe(false);
  });

  it("delete borra el encargo y sus renglones de materiales", async () => {
    expect(await daos.encargosDao.delete(1)).toBe(true);
    expect(await daos.encargosDao.delete(1)).toBe(false);
    expect(await daos.encargosDao.existePorMaterial(1)).toBe(false);
  });
});

// La base también impide borrar lo que está referenciado (FK RESTRICT, design D1), y el DAO lo traduce
// al mismo error de dominio que la regla del caso de uso.
describe("Sequelize: claves foráneas respaldan las reglas de baja", () => {
  let daos;

  beforeEach(async () => {
    daos = await createDaos({ persistenceType: "sequelize", dbStorage: ":memory:" });
    await daos.clientesDao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });
    await daos.materialesDao.save({ nombre: "Tablón de pino", unidad: "m", stock: 5 });
    await daos.encargosDao.save({ clienteId: 1, descripcion: "Mesa", materiales: [{ materialId: 1, cantidad: 1 }] });
  });

  it("borrar un cliente con encargos falla con 409 CLIENTE_CON_ENCARGOS", async () => {
    await expect(daos.clientesDao.delete(1)).rejects.toMatchObject({ code: "CLIENTE_CON_ENCARGOS", statusCode: 409 });
  });

  it("borrar un material usado falla con 409 MATERIAL_EN_USO", async () => {
    await expect(daos.materialesDao.delete(1)).rejects.toMatchObject({ code: "MATERIAL_EN_USO", statusCode: 409 });
  });
});
