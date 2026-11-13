import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "../helpers/buildTestApp.js";

const ERROR_REFS = ["#/components/schemas/Error", "#/components/schemas/ErrorValidacion"];

// Recorre la spec y devuelve cada respuesta de error (status >= 400) documentada.
const respuestasDeError = (spec) =>
  Object.entries(spec.paths).flatMap(([ruta, operaciones]) =>
    Object.entries(operaciones).flatMap(([metodo, operacion]) =>
      Object.entries(operacion.responses ?? {})
        .filter(([status]) => Number(status) >= 400)
        .map(([status, respuesta]) => ({ ruta, metodo, status, respuesta }))
    )
  );

describe("Documentación de la API", () => {
  it("acceso a la documentación: GET /api-docs/ responde 200 con HTML de Swagger UI", async () => {
    const app = await buildTestApp();

    const res = await request(app).get("/api-docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("swagger-ui");
  });

  it("descarga de la especificación: GET /api-docs.json responde 200 con openapi 3.x", async () => {
    const app = await buildTestApp();

    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
  });

  it("endpoint documentado con su error: toda respuesta de error usa $ref a Error o ErrorValidacion", async () => {
    const app = await buildTestApp();
    const { body: spec } = await request(app).get("/api-docs.json");

    const errores = respuestasDeError(spec);
    expect(errores.length).toBeGreaterThan(0);

    for (const { ruta, metodo, status, respuesta } of errores) {
      const ref = respuesta.content?.["application/json"]?.schema?.$ref;
      expect(ERROR_REFS, `${metodo.toUpperCase()} ${ruta} ${status}`).toContain(ref);
    }
  });
});
