import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildTestApp, MODOS_PERSISTENCIA } from "../helpers/buildTestApp.js";

// Spec materiales — escenarios de punta a punta sobre la app real.

const PINO = { nombre: "Tablón de pino", unidad: "m", stock: 2, stockMinimo: 5 };
const CANIO = { nombre: "Caño de hierro", unidad: "m", stock: 10, stockMinimo: 2 };
const CLAVOS = { nombre: "Clavos", unidad: "kg", stock: 3, stockMinimo: 1 };

let app;
const alta = (data) => request(app).post("/materiales").send(data);
const altas = async (...materiales) => {
  for (const material of materiales) expect((await alta(material)).status).toBe(201);
};
const nombres = (res) => res.body.map((m) => m.nombre);
const camposConError = (res) => res.body.error.details.map((d) => d.field).sort();

// La misma suite corre contra ambos adaptadores: es la prueba de "Mismas respuestas en ambos modos".
describe.each(MODOS_PERSISTENCIA)("materiales con persistencia %s", (persistenceType) => {
  beforeEach(async () => {
    app = await buildTestApp({ persistenceType });
  });

  describe("POST /materiales", () => {
    it("material creado: 201 con id, datos enviados y Location", async () => {
      const res = await alta({ nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 1, nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 });
      expect(res.headers.location).toBe("/materiales/1");
    });

    it("valores por defecto: stock y stockMinimo en 0", async () => {
      const res = await alta({ nombre: "Tornillo 4x40", unidad: "unidad" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ stock: 0, stockMinimo: 0 });
    });

    it("guarda el nombre sin espacios en los extremos", async () => {
      expect((await alta({ nombre: "  Barniz  ", unidad: "l" })).body.nombre).toBe("Barniz");
    });

    it("datos inválidos: unidad fuera de la lista y stock negativo → 400 con un detalle por campo", async () => {
      const res = await alta({ nombre: "Lija", unidad: "caja", stock: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(camposConError(res)).toEqual(["stock", "unidad"]);
    });

    it("datos inválidos: stock con más de 2 decimales → 400", async () => {
      const res = await alta({ nombre: "Lija", unidad: "unidad", stockMinimo: 1.005 });

      expect(res.status).toBe(400);
      expect(camposConError(res)).toEqual(["stockMinimo"]);
    });

    it("acepta cantidades con 2 decimales", async () => {
      expect((await alta({ nombre: "Barniz", unidad: "l", stock: 0.35 })).body.stock).toBe(0.35);
    });

    it("alta con nombre repetido: 409 MATERIAL_DUPLICADO sin distinguir mayúsculas ni espacios", async () => {
      await altas(PINO);

      const res = await alta({ nombre: " TABLÓN DE PINO ", unidad: "m" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("MATERIAL_DUPLICADO");
    });
  });

  describe("GET /materiales", () => {
    beforeEach(async () => {
      await altas(PINO, CANIO, CLAVOS);
    });

    it("listado completo ordenado por id", async () => {
      const res = await request(app).get("/materiales");

      expect(res.status).toBe(200);
      expect(res.body.map((m) => m.id)).toEqual([1, 2, 3]);
    });

    it("filtro por bajo stock", async () => {
      expect(nombres(await request(app).get("/materiales?bajoStock=true"))).toEqual(["Tablón de pino"]);
    });

    it("bajoStock=false devuelve los que están por encima del mínimo", async () => {
      expect(nombres(await request(app).get("/materiales?bajoStock=false"))).toEqual(["Caño de hierro", "Clavos"]);
    });

    it("filtro por unidad", async () => {
      expect(nombres(await request(app).get("/materiales?unidad=kg"))).toEqual(["Clavos"]);
    });

    it("filtro por nombre parcial", async () => {
      expect(nombres(await request(app).get("/materiales?nombre=PINO"))).toEqual(["Tablón de pino"]);
    });

    it("filtro inválido: bajoStock=quizas → 400 VALIDATION_ERROR", async () => {
      const res = await request(app).get("/materiales?bajoStock=quizas");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("orden por stock descendente", async () => {
      expect(nombres(await request(app).get("/materiales?sort=-stock"))).toEqual([
        "Caño de hierro",
        "Clavos",
        "Tablón de pino",
      ]);
    });

    it("campo de orden no permitido → 400", async () => {
      expect((await request(app).get("/materiales?sort=unidad")).status).toBe(400);
    });

    it("página de materiales: page=2&limit=2 devuelve el 3.º", async () => {
      expect((await request(app).get("/materiales?page=2&limit=2")).body.map((m) => m.id)).toEqual([3]);
    });
  });

  describe("GET /materiales/:id", () => {
    it("material existente: 200 con sus datos", async () => {
      await altas(PINO);

      const res = await request(app).get("/materiales/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, ...PINO });
    });

    it("material inexistente: 404 MATERIAL_NO_ENCONTRADO", async () => {
      const res = await request(app).get("/materiales/999");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MATERIAL_NO_ENCONTRADO");
    });

    it("id inválido: 400", async () => {
      expect((await request(app).get("/materiales/0")).status).toBe(400);
    });
  });

  describe("PUT /materiales/:id", () => {
    beforeEach(async () => {
      await altas(PINO, CANIO);
    });

    it("reposición de stock: 200 con el stock nuevo y el resto sin cambios", async () => {
      const res = await request(app).put("/materiales/1").send({ stock: 20 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, ...PINO, stock: 20 });
    });

    it("body vacío: 400", async () => {
      expect((await request(app).put("/materiales/1").send({})).status).toBe(400);
    });

    it("stock negativo: 400", async () => {
      expect((await request(app).put("/materiales/1").send({ stock: -3 })).status).toBe(400);
    });

    it("actualización con el nombre de otro material: 409 MATERIAL_DUPLICADO", async () => {
      const res = await request(app).put("/materiales/2").send({ nombre: "tablón de pino" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("MATERIAL_DUPLICADO");
    });

    it("actualizar inexistente: 404 MATERIAL_NO_ENCONTRADO", async () => {
      const res = await request(app).put("/materiales/999").send({ stock: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MATERIAL_NO_ENCONTRADO");
    });
  });

  describe("DELETE /materiales/:id", () => {
    it("material eliminado: 204 y luego GET responde 404", async () => {
      await altas(PINO);

      const res = await request(app).delete("/materiales/1");

      expect(res.status).toBe(204);
      expect(res.text).toBe("");
      expect((await request(app).get("/materiales/1")).status).toBe(404);
    });

    it("eliminar inexistente: 404 MATERIAL_NO_ENCONTRADO", async () => {
      const res = await request(app).delete("/materiales/999");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MATERIAL_NO_ENCONTRADO");
    });
  });
});
