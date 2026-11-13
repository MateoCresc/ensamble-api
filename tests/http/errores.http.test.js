import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "../helpers/buildTestApp.js";

describe("Ruta inexistente", () => {
  it("ruta no definida: responde 404 NOT_FOUND con método y ruta en el mensaje", async () => {
    const app = await buildTestApp();

    const res = await request(app).get("/no-existe");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("GET /no-existe");
  });
});

describe("Cuerpo JSON mal formado", () => {
  it("JSON inválido: responde 400 INVALID_JSON", async () => {
    const app = await buildTestApp();

    const res = await request(app)
      .post("/health")
      .set("Content-Type", "application/json")
      .send('{ "nombre": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});
