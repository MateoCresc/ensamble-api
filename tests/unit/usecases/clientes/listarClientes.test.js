import { describe, it, expect, beforeEach } from "vitest";
import { makeClientesUseCases } from "../../../../usecases/clientes/makeClientesUseCases.js";
import { ClientesMemoryDao } from "../../../../dao/clientes/clientes.memory.dao.js";

// Spec clientes — requisitos "Listado de clientes", "Filtros del listado",
// "Ordenamiento del listado" y "Paginación del listado".
// Los filtros llegan ya validados por el schema (números en page/limit, sort permitido).
describe("listarClientes", () => {
  let useCases;

  // Crea los clientes en el orden recibido (ids 1, 2, 3...) con emails únicos.
  const crear = async (...nombres) => {
    for (const [i, nombre] of nombres.entries()) {
      await useCases.crearCliente({ nombre, email: `cliente${i + 1}@mail.com` });
    }
  };
  const nombres = (clientes) => clientes.map((c) => c.nombre);
  const ids = (clientes) => clientes.map((c) => c.id);

  beforeEach(() => {
    useCases = makeClientesUseCases({ clientesDao: new ClientesMemoryDao() });
  });

  describe("listado", () => {
    it("listado completo: devuelve todos los clientes ordenados por id", async () => {
      await crear("Luis Sosa", "Ana Pérez", "Mariana Gómez");

      expect(ids(await useCases.listarClientes())).toEqual([1, 2, 3]);
    });

    it("sin clientes: devuelve un array vacío", async () => {
      expect(await useCases.listarClientes({})).toEqual([]);
    });
  });

  describe("filtros", () => {
    beforeEach(async () => {
      await useCases.crearCliente({ nombre: "Ana Pérez", email: "ana@mail.com" });
      await useCases.crearCliente({ nombre: "Mariana Gómez", email: "mariana@mail.com" });
      await useCases.crearCliente({ nombre: "Luis Sosa", email: "luis@mail.com" });
    });

    it("filtro por nombre parcial: coincide sin distinguir mayúsculas", async () => {
      expect(nombres(await useCases.listarClientes({ nombre: "ANA" }))).toEqual(["Ana Pérez", "Mariana Gómez"]);
    });

    it("filtro por email: coincidencia exacta sin distinguir mayúsculas", async () => {
      expect(nombres(await useCases.listarClientes({ email: "LUIS@mail.com" }))).toEqual(["Luis Sosa"]);
    });

    it("filtro por email: no hace coincidencias parciales", async () => {
      expect(await useCases.listarClientes({ email: "luis" })).toEqual([]);
    });

    it("con ambos filtros se aplican los dos", async () => {
      const resultado = await useCases.listarClientes({ nombre: "ana", email: "mariana@mail.com" });

      expect(nombres(resultado)).toEqual(["Mariana Gómez"]);
    });
  });

  describe("ordenamiento", () => {
    beforeEach(async () => {
      await crear("Luis Sosa", "Ana Pérez", "Mariana Gómez");
    });

    it("orden descendente por nombre: de la Z a la A", async () => {
      expect(nombres(await useCases.listarClientes({ sort: "-nombre" }))).toEqual([
        "Mariana Gómez",
        "Luis Sosa",
        "Ana Pérez",
      ]);
    });

    it("orden ascendente por nombre respetando acentos", async () => {
      await useCases.crearCliente({ nombre: "Álvaro Díaz", email: "alvaro@mail.com" });

      expect(nombres(await useCases.listarClientes({ sort: "nombre" }))).toEqual([
        "Álvaro Díaz",
        "Ana Pérez",
        "Luis Sosa",
        "Mariana Gómez",
      ]);
    });

    it("orden descendente por id", async () => {
      expect(ids(await useCases.listarClientes({ sort: "-id" }))).toEqual([3, 2, 1]);
    });

    it("orden ascendente por email", async () => {
      await useCases.crearCliente({ nombre: "Zoe Ruiz", email: "a-zoe@mail.com" });

      expect(nombres(await useCases.listarClientes({ sort: "email" }))[0]).toBe("Zoe Ruiz");
    });
  });

  describe("paginación", () => {
    it("segunda página: devuelve los clientes 3.º y 4.º", async () => {
      await crear("C1", "C2", "C3", "C4", "C5");

      expect(ids(await useCases.listarClientes({ page: 2, limit: 2 }))).toEqual([3, 4]);
    });

    it("se aplica después de filtrar y ordenar", async () => {
      await crear("Ana", "Bruno", "Carla", "Daniela", "Esteban");

      const resultado = await useCases.listarClientes({ nombre: "a", sort: "-nombre", page: 2, limit: 2 });

      expect(nombres(resultado)).toEqual(["Carla", "Ana"]);
    });

    it("solo page: usa limit 20 por defecto", async () => {
      await crear("C1", "C2", "C3");

      expect(ids(await useCases.listarClientes({ page: 1 }))).toEqual([1, 2, 3]);
      expect(await useCases.listarClientes({ page: 2 })).toEqual([]);
    });

    it("solo limit: usa page 1 por defecto", async () => {
      await crear("C1", "C2", "C3");

      expect(ids(await useCases.listarClientes({ limit: 2 }))).toEqual([1, 2]);
    });
  });
});
