import { describe, it, expect, beforeEach } from "vitest";
import { createDaos } from "../../../dao/daoFactory.js";
import { MODOS_PERSISTENCIA } from "../../helpers/buildTestApp.js";

// Contrato del DAO de clientes: ambos adaptadores deben comportarse igual (consigna 2.4, design D3).
const esPlano = (objeto) => Object.getPrototypeOf(objeto) === Object.prototype;

describe.each(MODOS_PERSISTENCIA)("DAO de clientes (%s)", (persistenceType) => {
  let dao;

  beforeEach(async () => {
    ({ clientesDao: dao } = await createDaos({ persistenceType, dbStorage: ":memory:" }));
  });

  it("save devuelve un objeto plano con id propio, telefono null y sin campos ajenos", async () => {
    const cliente = await dao.save({ id: 50, nombre: "Ana Pérez", email: "ana@mail.com", extra: true });

    expect(cliente).toEqual({ id: 1, nombre: "Ana Pérez", email: "ana@mail.com", telefono: null });
    expect(esPlano(cliente)).toBe(true);
  });

  it("getAll devuelve objetos planos ordenados por id", async () => {
    await dao.save({ nombre: "Luis Sosa", email: "luis@mail.com" });
    await dao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });

    const clientes = await dao.getAll();

    expect(clientes.map((c) => c.id)).toEqual([1, 2]);
    expect(clientes.every(esPlano)).toBe(true);
  });

  it("getById devuelve null si no existe", async () => {
    expect(await dao.getById(99)).toBeNull();
  });

  it("getByEmail no distingue mayúsculas", async () => {
    await dao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });

    expect(await dao.getByEmail("ANA@Mail.com")).toMatchObject({ id: 1 });
    expect(await dao.getByEmail("otra@mail.com")).toBeNull();
  });

  it("update aplica solo los campos de la entidad y no cambia el id", async () => {
    await dao.save({ nombre: "Ana Pérez", email: "ana@mail.com", telefono: "1155550000" });

    const actualizado = await dao.update(1, { id: 9, telefono: null, color: "azul" });

    expect(actualizado).toEqual({ id: 1, nombre: "Ana Pérez", email: "ana@mail.com", telefono: null });
    expect(await dao.update(99, { nombre: "Nadie" })).toBeNull();
  });

  it("delete devuelve true si borró y false si no existía", async () => {
    await dao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });

    expect(await dao.delete(1)).toBe(true);
    expect(await dao.delete(1)).toBe(false);
    expect(await dao.getAll()).toEqual([]);
  });
});

// Spec persistencia — "Unicidad garantizada también por la base": aunque se saltee el caso de uso,
// la base rechaza el email repetido y el DAO lo traduce al mismo error de dominio.
describe("DAO de clientes en Sequelize: unicidad respaldada por la base", () => {
  it("dos altas con el mismo email: la segunda falla con 409 EMAIL_DUPLICADO", async () => {
    const { clientesDao } = await createDaos({ persistenceType: "sequelize", dbStorage: ":memory:" });
    await clientesDao.save({ nombre: "Ana Pérez", email: "ana@mail.com" });

    await expect(clientesDao.save({ nombre: "Otra Ana", email: "ana@mail.com" })).rejects.toMatchObject({
      code: "EMAIL_DUPLICADO",
      statusCode: 409,
    });
  });
});
