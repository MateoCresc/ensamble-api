import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildTestApp } from "../helpers/buildTestApp.js";

// Spec clientes — escenarios de punta a punta sobre la app real (createApp) con persistencia en memoria.
// Cada test arma una app nueva, así que arranca sin clientes; los datos se crean con POST.

const ANA = { nombre: "Ana Pérez", email: "ana@mail.com", telefono: "1155550000" };
const MARIANA = { nombre: "Mariana Gómez", email: "mariana@mail.com" };
const LUIS = { nombre: "Luis Sosa", email: "luis@mail.com" };

let app;
const alta = (data) => request(app).post("/clientes").send(data);
const altas = async (...clientes) => {
  for (const cliente of clientes) {
    const res = await alta(cliente);
    expect(res.status).toBe(201);
  }
};
const nombres = (res) => res.body.map((c) => c.nombre);

beforeEach(async () => {
  app = await buildTestApp();
});

describe("POST /clientes", () => {
  it("cliente creado: 201 con id entero, telefono null y header Location", async () => {
    const res = await alta({ nombre: "Ana Pérez", email: "ana@mail.com" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, nombre: "Ana Pérez", email: "ana@mail.com", telefono: null });
    expect(res.headers.location).toBe("/clientes/1");
  });

  it("guarda el email en minúsculas y sin espacios", async () => {
    const res = await alta({ nombre: "Ana Pérez", email: "  ANA@Mail.com " });

    expect(res.body.email).toBe("ana@mail.com");
  });

  it("id enviado por el cliente: se ignora", async () => {
    const res = await alta({ id: 99, ...LUIS });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });

  it("datos inválidos: 400 VALIDATION_ERROR con un detalle por campo inválido", async () => {
    const res = await alta({ email: "no-es-un-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(["email", "nombre"]);
  });

  it("rechaza un teléfono con caracteres no permitidos", async () => {
    const res = await alta({ ...LUIS, telefono: "llamame" });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("telefono");
  });

  it("alta con email repetido: 409 EMAIL_DUPLICADO sin distinguir mayúsculas", async () => {
    await altas(ANA);

    const res = await alta({ nombre: "Otra Ana", email: "ANA@mail.com" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_DUPLICADO");
  });
});

describe("GET /clientes", () => {
  it("listado completo: 200 con todos los clientes ordenados por id", async () => {
    await altas(LUIS, ANA, MARIANA);

    const res = await request(app).get("/clientes");

    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it("sin clientes: 200 con array vacío", async () => {
    const res = await request(app).get("/clientes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("filtro por nombre parcial", async () => {
    await altas(ANA, MARIANA, LUIS);

    expect(nombres(await request(app).get("/clientes?nombre=ana"))).toEqual(["Ana Pérez", "Mariana Gómez"]);
  });

  it("filtro por email: coincidencia exacta sin distinguir mayúsculas", async () => {
    await altas(ANA, LUIS);

    expect(nombres(await request(app).get("/clientes?email=LUIS@mail.com"))).toEqual(["Luis Sosa"]);
  });

  it("orden descendente por nombre", async () => {
    await altas(ANA, MARIANA, LUIS);

    expect(nombres(await request(app).get("/clientes?sort=-nombre"))).toEqual([
      "Mariana Gómez",
      "Luis Sosa",
      "Ana Pérez",
    ]);
  });

  it("campo de orden no permitido: 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/clientes?sort=telefono");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].field).toBe("sort");
  });

  it("segunda página: page=2&limit=2 devuelve los clientes 3.º y 4.º", async () => {
    for (let i = 1; i <= 5; i++) await altas({ nombre: `Cliente ${i}`, email: `c${i}@mail.com` });

    const res = await request(app).get("/clientes?page=2&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.id)).toEqual([3, 4]);
  });

  it("límite excedido: limit=500 responde 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/clientes?limit=500");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("page no numérico: 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/clientes?page=dos");

    expect(res.status).toBe(400);
  });
});

describe("GET /clientes/:id", () => {
  it("cliente existente: 200 con sus datos", async () => {
    await altas(ANA);

    const res = await request(app).get("/clientes/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, ...ANA });
  });

  it("cliente inexistente: 404 CLIENTE_NO_ENCONTRADO", async () => {
    const res = await request(app).get("/clientes/999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CLIENTE_NO_ENCONTRADO");
  });

  it("id inválido: 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/clientes/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("PUT /clientes/:id", () => {
  beforeEach(async () => {
    await altas(ANA, LUIS);
  });

  it("actualización parcial: 200 con el campo nuevo y el resto sin cambios", async () => {
    const res = await request(app).put("/clientes/1").send({ telefono: "1166660000" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, nombre: ANA.nombre, email: ANA.email, telefono: "1166660000" });
  });

  it("body vacío: 400 VALIDATION_ERROR", async () => {
    const res = await request(app).put("/clientes/1").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("body solo con campos desconocidos: 400 VALIDATION_ERROR", async () => {
    const res = await request(app).put("/clientes/1").send({ edad: 30 });

    expect(res.status).toBe(400);
  });

  it("actualizar inexistente: 404 CLIENTE_NO_ENCONTRADO", async () => {
    const res = await request(app).put("/clientes/999").send({ nombre: "Nadie" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CLIENTE_NO_ENCONTRADO");
  });

  it("actualización con email de otro cliente: 409 EMAIL_DUPLICADO", async () => {
    const res = await request(app).put("/clientes/2").send({ email: "Ana@Mail.com" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_DUPLICADO");
  });

  it("actualización conservando el propio email: 200", async () => {
    const res = await request(app).put("/clientes/1").send({ email: ANA.email, nombre: "Ana P. Gómez" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Ana P. Gómez");
  });
});

describe("DELETE /clientes/:id", () => {
  it("cliente eliminado: 204 sin cuerpo y luego GET responde 404", async () => {
    await altas(ANA);

    const res = await request(app).delete("/clientes/1");

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect((await request(app).get("/clientes/1")).status).toBe(404);
  });

  it("eliminar inexistente: 404 CLIENTE_NO_ENCONTRADO", async () => {
    const res = await request(app).delete("/clientes/999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CLIENTE_NO_ENCONTRADO");
  });
});
