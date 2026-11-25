import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { buildTestApp, MODOS_PERSISTENCIA, notificadorSilencioso } from "../helpers/buildTestApp.js";

// Spec encargos y notificaciones — de punta a punta, la misma suite en ambos modos de persistencia.

const MESA = { clienteId: 1, descripcion: "Mesa de comedor", fechaEntregaEstimada: "2026-12-20", materiales: [{ materialId: 1, cantidad: 4.5 }] };

let app;
const http = () => request(app);
const prepararDatos = async () => {
  await http().post("/clientes").send({ nombre: "Ana Pérez", email: "ana@mail.com" }).expect(201);
  await http().post("/clientes").send({ nombre: "Luis Sosa", email: "luis@mail.com" }).expect(201);
  await http().post("/materiales").send({ nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 }).expect(201);
  await http().post("/materiales").send({ nombre: "Caño de hierro", unidad: "m", stock: 3, stockMinimo: 1 }).expect(201);
};
const alta = (data) => http().post("/encargos").send(data);
const accion = (id, nombre) => http().put(`/encargos/${id}/${nombre}`);
const stock = async (id) => (await http().get(`/materiales/${id}`)).body.stock;

describe.each(MODOS_PERSISTENCIA)("encargos con persistencia %s", (persistenceType) => {
  beforeEach(async () => {
    app = await buildTestApp({ persistenceType });
    await prepararDatos();
  });

  describe("POST /encargos", () => {
    it("encargo creado: 201 presupuestado con cliente, materiales y Location", async () => {
      const res = await alta(MESA);

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe("/encargos/1");
      expect(res.body).toEqual({
        id: 1,
        clienteId: 1,
        cliente: { id: 1, nombre: "Ana Pérez" },
        descripcion: "Mesa de comedor",
        estado: "presupuestado",
        fechaEntregaEstimada: "2026-12-20",
        materiales: [{ materialId: 1, nombre: "Tablón de pino", unidad: "m", cantidad: 4.5 }],
      });
    });

    it("encargo sin materiales: materiales vacío y fecha null", async () => {
      const res = await alta({ clienteId: 2, descripcion: "Reja de ventana" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ materiales: [], fechaEntregaEstimada: null });
    });

    it("cliente inexistente: 404 CLIENTE_NO_ENCONTRADO", async () => {
      const res = await alta({ ...MESA, clienteId: 999 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CLIENTE_NO_ENCONTRADO");
    });

    it("material inexistente: 404 MATERIAL_NO_ENCONTRADO con los ids", async () => {
      const res = await alta({ ...MESA, materiales: [{ materialId: 9, cantidad: 1 }] });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatchObject({ code: "MATERIAL_NO_ENCONTRADO", details: { ids: [9] } });
    });

    it.each([
      ["material repetido", { materiales: [{ materialId: 1, cantidad: 1 }, { materialId: 1, cantidad: 2 }] }],
      ["cantidad 0", { materiales: [{ materialId: 1, cantidad: 0 }] }],
      ["cantidad con 3 decimales", { materiales: [{ materialId: 1, cantidad: 1.125 }] }],
      ["fecha mal formada", { fechaEntregaEstimada: "20/12/2026" }],
      ["descripción muy corta", { descripcion: "ab" }],
    ])("%s: 400 VALIDATION_ERROR", async (_, cambio) => {
      const res = await alta({ ...MESA, ...cambio });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("consultas", () => {
    beforeEach(async () => {
      await alta(MESA).expect(201);
      await alta({ clienteId: 2, descripcion: "Reja de ventana" }).expect(201);
      await alta({ clienteId: 1, descripcion: "Banco de plaza", materiales: [{ materialId: 2, cantidad: 1 }] }).expect(201);
      await accion(3, "confirmar").expect(200);
    });

    it("GET /encargos/:id: 200 con cliente y materiales", async () => {
      const res = await http().get("/encargos/1");

      expect(res.status).toBe(200);
      expect(res.body.cliente).toEqual({ id: 1, nombre: "Ana Pérez" });
    });

    it("encargo inexistente: 404 ENCARGO_NO_ENCONTRADO", async () => {
      const res = await http().get("/encargos/999");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ENCARGO_NO_ENCONTRADO");
    });

    it("encargos de un cliente", async () => {
      expect((await http().get("/encargos?clienteId=1")).body.map((e) => e.id)).toEqual([1, 3]);
    });

    it("filtro por estado", async () => {
      expect((await http().get("/encargos?estado=confirmado")).body.map((e) => e.id)).toEqual([3]);
    });

    it("estado inexistente: 400 VALIDATION_ERROR", async () => {
      expect((await http().get("/encargos?estado=terminado")).status).toBe(400);
    });
  });

  describe("PUT y DELETE /encargos/:id", () => {
    beforeEach(async () => {
      await alta(MESA).expect(201);
    });

    it("reemplazo de materiales: 200 con la lista nueva", async () => {
      const res = await http().put("/encargos/1").send({ materiales: [{ materialId: 2, cantidad: 3 }] });

      expect(res.status).toBe(200);
      expect(res.body.materiales).toEqual([{ materialId: 2, nombre: "Caño de hierro", unidad: "m", cantidad: 3 }]);
    });

    it("body sin campos editables: 400", async () => {
      expect((await http().put("/encargos/1").send({ clienteId: 2 })).status).toBe(400);
    });

    it("encargo ya confirmado: 409 ENCARGO_NO_EDITABLE", async () => {
      await accion(1, "confirmar").expect(200);

      const res = await http().put("/encargos/1").send({ descripcion: "Otra cosa" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ENCARGO_NO_EDITABLE");
    });

    it("baja de presupuesto: 204 y luego 404", async () => {
      await http().delete("/encargos/1").expect(204);

      expect((await http().get("/encargos/1")).status).toBe(404);
    });

    it("baja de encargo confirmado: 409 ENCARGO_NO_ELIMINABLE", async () => {
      await accion(1, "confirmar").expect(200);

      const res = await http().delete("/encargos/1");

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ENCARGO_NO_ELIMINABLE");
    });
  });

  describe("ciclo de vida", () => {
    it("confirmación exitosa: 200 confirmado y el material queda con stock 8", async () => {
      await alta(MESA).expect(201);

      const res = await accion(1, "confirmar");

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("confirmado");
      expect(await stock(1)).toBe(8);
    });

    it("stock insuficiente: 409 con el detalle y sin modificar nada", async () => {
      await alta({ ...MESA, materiales: [{ materialId: 1, cantidad: 2 }, { materialId: 2, cantidad: 5 }] }).expect(201);

      const res = await accion(1, "confirmar");

      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({
        code: "STOCK_INSUFICIENTE",
        details: [{ materialId: 2, nombre: "Caño de hierro", requerido: 5, disponible: 3 }],
      });
      expect(await stock(1)).toBe(12.5);
      expect((await http().get("/encargos/1")).body.estado).toBe("presupuestado");
    });

    it("encargo sin materiales: 409 ENCARGO_SIN_MATERIALES", async () => {
      await alta({ clienteId: 1, descripcion: "Reja" }).expect(201);

      expect((await accion(1, "confirmar")).body.error.code).toBe("ENCARGO_SIN_MATERIALES");
    });

    it("cancelar un confirmado: repone el stock", async () => {
      await alta(MESA).expect(201);
      await accion(1, "confirmar").expect(200);

      const res = await accion(1, "cancelar");

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("cancelado");
      expect(await stock(1)).toBe(12.5);
    });

    it("recorrido completo: confirmar → iniciar → entregar", async () => {
      await alta(MESA).expect(201);
      await accion(1, "confirmar").expect(200);
      await accion(1, "iniciar").expect(200);

      const res = await accion(1, "entregar");

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("entregado");
    });

    it("confirmar dos veces: 409 TRANSICION_INVALIDA y el stock no se descuenta de nuevo", async () => {
      await alta(MESA).expect(201);
      await accion(1, "confirmar").expect(200);

      const res = await accion(1, "confirmar");

      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({
        code: "TRANSICION_INVALIDA",
        details: { estadoActual: "confirmado", accion: "confirmar" },
      });
      expect(await stock(1)).toBe(8);
    });

    it("cancelar un entregado: 409 TRANSICION_INVALIDA", async () => {
      await alta(MESA).expect(201);
      for (const paso of ["confirmar", "iniciar", "entregar"]) await accion(1, paso).expect(200);

      expect((await accion(1, "cancelar")).body.error.code).toBe("TRANSICION_INVALIDA");
    });

    it("acción sobre un encargo inexistente: 404 ENCARGO_NO_ENCONTRADO", async () => {
      const res = await accion(999, "iniciar");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ENCARGO_NO_ENCONTRADO");
    });
  });

  describe("reglas de baja de clientes y materiales", () => {
    beforeEach(async () => {
      await alta(MESA).expect(201);
    });

    it("baja de cliente con encargos: 409 CLIENTE_CON_ENCARGOS y el cliente sigue", async () => {
      const res = await http().delete("/clientes/1");

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CLIENTE_CON_ENCARGOS");
      expect((await http().get("/clientes/1")).status).toBe(200);
    });

    it("baja de material usado: 409 MATERIAL_EN_USO y el material sigue", async () => {
      const res = await http().delete("/materiales/1");

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("MATERIAL_EN_USO");
      expect((await http().get("/materiales/1")).status).toBe(200);
    });
  });
});

describe.each(MODOS_PERSISTENCIA)("notificaciones con persistencia %s", (persistenceType) => {
  afterEach(() => vi.restoreAllMocks());

  it("confirmar avisa el encargo por su canal y el stock bajo por el suyo", async () => {
    const avisosEncargos = [];
    const avisosStock = [];
    app = await buildTestApp({
      persistenceType,
      notificadores: {
        encargos: { notificar: async (aviso) => avisosEncargos.push(aviso) },
        stock: { notificar: async (aviso) => avisosStock.push(aviso) },
      },
    });
    await prepararDatos();
    await alta({ ...MESA, materiales: [{ materialId: 1, cantidad: 10 }] }).expect(201); // pino 12.5 → 2.5 (mínimo 3)

    await accion(1, "confirmar").expect(200);
    await new Promise((resolve) => setImmediate(resolve));

    expect(avisosEncargos.map((a) => a.mensaje)).toEqual([expect.stringMatching(/#1 de Ana Pérez/)]);
    expect(avisosStock.map((a) => a.mensaje)).toEqual([expect.stringMatching(/Tablón de pino: quedan 2.5 m \(mínimo 3\)/)]);
  });

  it("canal caído: la confirmación responde 200 y descuenta el stock igual", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const caido = { notificar: async () => Promise.reject(new Error("canal caído")) };
    app = await buildTestApp({ persistenceType, notificadores: { encargos: caido, stock: notificadorSilencioso } });
    await prepararDatos();
    await alta(MESA).expect(201);

    const res = await accion(1, "confirmar");
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("confirmado");
    expect(await stock(1)).toBe(8);
    expect(console.error).toHaveBeenCalled();
  });
});
