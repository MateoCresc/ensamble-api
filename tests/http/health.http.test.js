import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "../helpers/buildTestApp.js";

describe("GET /health", () => {
  it("servicio activo en memoria: responde 200 con status ok y persistence memory", async () => {
    const app = await buildTestApp();

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", persistence: "memory" });
  });

  it("servicio activo con base de datos: responde 200 con persistence sequelize", async () => {
    const app = await buildTestApp({ persistenceType: "sequelize" });

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.persistence).toBe("sequelize");
  });
});
