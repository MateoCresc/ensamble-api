import { describe, it, expect, beforeEach } from "vitest";
import { escenarioEncargos } from "../../../helpers/escenarioEncargos.js";

// Spec encargos — requisito "Listado de encargos".
describe("listarEncargos", () => {
  let e;

  beforeEach(async () => {
    e = await escenarioEncargos();
    await e.useCases.crearEncargo({ clienteId: e.ana.id, descripcion: "Mesa" });
    await e.useCases.crearEncargo({ clienteId: e.luis.id, descripcion: "Reja" });
    await e.useCases.crearEncargo({ clienteId: e.ana.id, descripcion: "Banco" });
    await e.encargosDao.cambiarEstado(3, { desde: ["presupuestado"], hacia: "confirmado" });
  });

  const descripciones = (encargos) => encargos.map((x) => x.descripcion);

  it("listado completo ordenado por id", async () => {
    expect(descripciones(await e.useCases.listarEncargos())).toEqual(["Mesa", "Reja", "Banco"]);
  });

  it("encargos de un cliente", async () => {
    expect(descripciones(await e.useCases.listarEncargos({ clienteId: e.ana.id }))).toEqual(["Mesa", "Banco"]);
  });

  it("filtro por estado", async () => {
    expect(descripciones(await e.useCases.listarEncargos({ estado: "confirmado" }))).toEqual(["Banco"]);
  });

  it("orden descendente por id y paginación", async () => {
    expect(descripciones(await e.useCases.listarEncargos({ sort: "-id", page: 1, limit: 2 }))).toEqual([
      "Banco",
      "Reja",
    ]);
  });
});
