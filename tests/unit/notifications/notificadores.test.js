import { describe, it, expect, afterEach, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { consoleNotifier } from "../../../notifications/consoleNotifier.js";
import { createFileNotifier } from "../../../notifications/fileNotifier.js";
import { crearNotificador } from "../../../notifications/notifierFactory.js";

// Notificadores con interfaz propia notificar({ asunto, mensaje }) (consigna 2.6, design D6).
describe("notificadores", () => {
  let directorio;

  afterEach(async () => {
    vi.restoreAllMocks();
    if (directorio) await rm(directorio, { recursive: true, force: true });
  });

  it("consoleNotifier escribe el asunto y el mensaje en la consola", async () => {
    const consola = vi.spyOn(console, "log").mockImplementation(() => {});

    await consoleNotifier.notificar({ asunto: "Encargo confirmado", mensaje: "Encargo #1" });

    expect(consola).toHaveBeenCalledWith("[NOTIFICACIÓN] Encargo confirmado — Encargo #1");
  });

  it("el notificador de archivo agrega una línea con fecha, asunto y mensaje por aviso", async () => {
    directorio = await mkdtemp(join(tmpdir(), "ensamble-avisos-"));
    const ruta = join(directorio, "notificaciones.log");
    const notificador = createFileNotifier({ ruta });

    await notificador.notificar({ asunto: "Stock bajo", mensaje: "Tablón de pino: quedan 2 m (mínimo 3)" });
    await notificador.notificar({ asunto: "Stock bajo", mensaje: "Clavos: quedan 1 kg (mínimo 1)" });

    const lineas = (await readFile(ruta, "utf8")).trim().split("\n");
    expect(lineas).toHaveLength(2);
    expect(lineas[0]).toMatch(/^\d{4}-\d{2}-\d{2}T.* \| Stock bajo \| Tablón de pino: quedan 2 m \(mínimo 3\)$/);
  });

  it("crearNotificador devuelve el tipo pedido y rechaza uno desconocido", () => {
    expect(crearNotificador("console")).toBe(consoleNotifier);
    expect(typeof crearNotificador("file", { ruta: "x.log" }).notificar).toBe("function");
    expect(() => crearNotificador("sms")).toThrow(/sms/);
  });
});
