import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "../../../middlewares/validate.js";
import { errorHandler } from "../../../middlewares/errorHandler.js";

describe("validate", () => {
  it("body inválido: responde 400 VALIDATION_ERROR con details [{ field, message }]", async () => {
    const schema = z.object({ nombre: z.string().min(1) });
    const app = express();
    app.use(express.json());
    app.post("/recurso", validate(schema), (req, res) => res.status(201).json(req.body));
    app.use(errorHandler);

    const res = await request(app).post("/recurso").send({ nombre: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual([
      { field: "nombre", message: expect.any(String) },
    ]);
  });

  it("query válida: reemplaza req.query por el dato parseado", async () => {
    const schema = z.object({ pagina: z.coerce.number().int() });
    const app = express();
    app.get("/recurso", validate(schema, "query"), (req, res) => res.json(req.query));
    app.use(errorHandler);

    const res = await request(app).get("/recurso?pagina=2");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pagina: 2 });
  });

  it("target inválido: lanza un error al construir el middleware", () => {
    const schema = z.object({});

    expect(() => validate(schema, "headers")).toThrow(/target inválido/);
  });
});
