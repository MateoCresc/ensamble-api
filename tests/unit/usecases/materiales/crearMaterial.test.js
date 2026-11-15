import { describe, it, expect, beforeEach } from "vitest";
import { makeMaterialesUseCases } from "../../../../usecases/materiales/makeMaterialesUseCases.js";
import { MaterialesMemoryDao } from "../../../../dao/materiales/materiales.memory.dao.js";
import { AppError } from "../../../../errors/AppError.js";

// Spec materiales — requisitos "Alta de material" y "Nombre único de material".
describe("crearMaterial", () => {
  let useCases;

  beforeEach(() => {
    useCases = makeMaterialesUseCases({ materialesDao: new MaterialesMemoryDao() });
  });

  it("material creado: asigna id entero y conserva los datos enviados", async () => {
    const material = await useCases.crearMaterial({ nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 });

    expect(material).toEqual({ id: 1, nombre: "Tablón de pino", unidad: "m", stock: 12.5, stockMinimo: 3 });
  });

  it("valores por defecto: stock y stockMinimo en 0", async () => {
    const material = await useCases.crearMaterial({ nombre: "Tornillo 4x40", unidad: "unidad" });

    expect(material).toMatchObject({ stock: 0, stockMinimo: 0 });
  });

  it("ignora un id enviado y descarta campos ajenos a la entidad", async () => {
    const material = await useCases.crearMaterial({ id: 77, nombre: "Barniz", unidad: "l", color: "rojo" });

    expect(material).toEqual({ id: 1, nombre: "Barniz", unidad: "l", stock: 0, stockMinimo: 0 });
  });

  it("alta con nombre repetido: 409 MATERIAL_DUPLICADO sin distinguir mayúsculas ni espacios", async () => {
    await useCases.crearMaterial({ nombre: "Tablón de pino", unidad: "m" });

    const intento = useCases.crearMaterial({ nombre: " TABLÓN DE PINO ", unidad: "m" });

    await expect(intento).rejects.toBeInstanceOf(AppError);
    await expect(intento).rejects.toMatchObject({ code: "MATERIAL_DUPLICADO", statusCode: 409 });
  });
});
