import { z } from "zod";
import { idParamSchema, paginacion, sortSchema, cantidad, booleanoQuery } from "./comunes.schema.js";

// Schemas de entrada de Materiales. El nombre único es regla de negocio (caso de uso).

export const UNIDADES = ["unidad", "m", "m2", "kg", "l"];

const fields = {
  nombre: z
    .string({ error: "El nombre es obligatorio y debe ser texto" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre puede tener hasta 100 caracteres"),
  unidad: z.enum(UNIDADES, { error: `La unidad debe ser una de: ${UNIDADES.join(", ")}` }),
  stock: cantidad("El stock"),
  stockMinimo: cantidad("El stock mínimo"),
};

// POST /materiales
export const crearMaterialSchema = z.object({
  nombre: fields.nombre,
  unidad: fields.unidad,
  stock: fields.stock.default(0),
  stockMinimo: fields.stockMinimo.default(0),
});

// PUT /materiales/:id — actualización parcial: al menos un campo.
export const actualizarMaterialSchema = z
  .object({
    nombre: fields.nombre.optional(),
    unidad: fields.unidad.optional(),
    stock: fields.stock.optional(),
    stockMinimo: fields.stockMinimo.optional(),
  })
  .refine((cambios) => Object.keys(cambios).length > 0, {
    message: "Enviá al menos uno de estos campos: nombre, unidad, stock o stockMinimo",
  });

export const materialIdParamSchema = idParamSchema;

// GET /materiales
export const listarMaterialesQuerySchema = z.object({
  nombre: z.string().trim().min(1, "El filtro nombre no puede estar vacío").optional(),
  unidad: fields.unidad.optional(),
  bajoStock: booleanoQuery("bajoStock").optional(),
  sort: sortSchema(["id", "nombre", "stock"]),
  ...paginacion,
});
