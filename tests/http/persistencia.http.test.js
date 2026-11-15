import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildTestApp } from "../helpers/buildTestApp.js";

// Spec persistencia — "Conservación de datos" y "Selección de persistencia por configuración".
// Un "reinicio" se simula armando una segunda app con la misma configuración.

const ANA = { nombre: "Ana Pérez", email: "ana@mail.com" };

describe("Conservación de datos entre reinicios", () => {
  let directorio;
  const apps = [];
  const arrancar = async (opciones) => {
    const app = await buildTestApp(opciones);
    apps.push(app);
    return app;
  };

  beforeEach(async () => {
    directorio = await mkdtemp(join(tmpdir(), "ensamble-test-"));
  });

  afterEach(async () => {
    // Cerrar las conexiones antes de borrar el archivo (en Windows un archivo abierto no se puede borrar).
    for (const app of apps.splice(0)) await app.locals.cerrar();
    await rm(directorio, { recursive: true, force: true });
  });

  it("reinicio con base de datos: los datos siguen estando con el mismo DB_STORAGE", async () => {
    const dbStorage = join(directorio, "ensamble.sqlite");
    const primera = await arrancar({ persistenceType: "sequelize", dbStorage });
    await request(primera).post("/clientes").send(ANA).expect(201);
    await request(primera).post("/materiales").send({ nombre: "Clavos", unidad: "kg", stock: 3.5 }).expect(201);

    const segunda = await arrancar({ persistenceType: "sequelize", dbStorage });

    expect((await request(segunda).get("/clientes")).body).toEqual([{ id: 1, ...ANA, telefono: null }]);
    expect((await request(segunda).get("/materiales/1")).body.stock).toBe(3.5);
  });

  it("reinicio en memoria: cada arranque comienza sin datos", async () => {
    const primera = await arrancar({ persistenceType: "memory" });
    await request(primera).post("/clientes").send(ANA).expect(201);

    const segunda = await arrancar({ persistenceType: "memory" });

    expect((await request(segunda).get("/clientes")).body).toEqual([]);
  });
});

describe("Selección de persistencia por configuración", () => {
  it("valor inválido: el servidor no arranca y lista los valores permitidos", () => {
    const raiz = resolve(import.meta.dirname, "../..");

    const proceso = spawnSync(process.execPath, ["index.js"], {
      cwd: raiz,
      env: { ...process.env, PERSISTENCE_TYPE: "mongo" },
      encoding: "utf8",
      timeout: 15000,
    });

    expect(proceso.status).not.toBe(0);
    expect(proceso.stderr).toMatch(/PERSISTENCE_TYPE inválido/);
    expect(proceso.stderr).toMatch(/memory, sequelize/);
  });
});
