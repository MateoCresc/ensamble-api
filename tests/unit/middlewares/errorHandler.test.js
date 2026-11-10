import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "../../../middlewares/errorHandler.js";
import { AppError } from "../../../errors/AppError.js";

// App mínima: una ruta que lanza el error recibido, seguida del errorHandler real (design D4).
const appQueLanza = (error) => {
  const app = express();
  app.get("/falla", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
};

describe("errorHandler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("error de dominio con detalles: usa su status e incluye code, message y details", async () => {
    const details = [{ field: "nombre", message: "Requerido" }];
    const app = appQueLanza(new AppError("DATO_INVALIDO", "Dato inválido", 422, details));

    const res = await request(app).get("/falla");

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: { code: "DATO_INVALIDO", message: "Dato inválido", details },
    });
  });

  it("error de dominio sin detalles: el cuerpo no incluye la clave details", async () => {
    const app = appQueLanza(new AppError("NO_ENCONTRADO", "No existe", 404));

    const res = await request(app).get("/falla");

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: "NO_ENCONTRADO", message: "No existe" });
    expect(res.body.error).not.toHaveProperty("details");
  });

  it("excepción no controlada: responde 500 INTERNAL_ERROR sin exponer el stack", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("detalle interno secreto");
    const app = appQueLanza(error);

    const res = await request(app).get("/falla");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(res.body.error).not.toHaveProperty("details");
    expect(res.text).not.toContain("detalle interno secreto");
    expect(res.text).not.toContain(error.stack.split("\n")[1].trim());
  });
});
