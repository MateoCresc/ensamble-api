import { z } from "zod";
import { entero, idParamSchema, paginacion, sortSchema, cantidad } from "./comunes.schema.js";
import { ESTADOS } from "../usecases/encargos/estados.js";

// Schemas de entrada de Encargos (design D9). Existencia de cliente/materiales y reglas de estado
// son del dominio (casos de uso); acá solo la forma de los datos.

const idEnBody = (campo) =>
  z.number({ error: `${campo} debe ser un número` }).int(`${campo} debe ser un entero`).positive(`${campo} debe ser mayor a 0`);

const renglon = z.object({
  materialId: idEnBody("materialId"),
  cantidad: cantidad("La cantidad").refine((valor) => valor > 0, "La cantidad debe ser mayor a 0"),
});

const sinRepetidos = (materiales) => new Set(materiales.map((m) => m.materialId)).size === materiales.length;

const fields = {
  descripcion: z
    .string({ error: "La descripción es obligatoria y debe ser texto" })
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(500, "La descripción puede tener hasta 500 caracteres"),
  fechaEntregaEstimada: z.iso.date({ error: "La fecha debe tener formato AAAA-MM-DD" }).nullable(),
  materiales: z
    .array(renglon, { error: "materiales debe ser una lista de { materialId, cantidad }" })
    .refine(sinRepetidos, "No se puede repetir un materialId en la lista"),
};

// POST /encargos
export const crearEncargoSchema = z.object({
  clienteId: idEnBody("clienteId"),
  descripcion: fields.descripcion,
  fechaEntregaEstimada: fields.fechaEntregaEstimada.optional(),
  materiales: fields.materiales.optional(),
});

// PUT /encargos/:id — clienteId no se puede cambiar (design D7); al menos un campo.
export const actualizarEncargoSchema = z
  .object({
    descripcion: fields.descripcion.optional(),
    fechaEntregaEstimada: fields.fechaEntregaEstimada.optional(),
    materiales: fields.materiales.optional(),
  })
  .refine((cambios) => Object.keys(cambios).length > 0, {
    message: "Enviá al menos uno de estos campos: descripcion, fechaEntregaEstimada o materiales",
  });

export const encargoIdParamSchema = idParamSchema;

// GET /encargos
export const listarEncargosQuerySchema = z.object({
  clienteId: entero("clienteId").optional(),
  estado: z.enum(ESTADOS, { error: `estado debe ser uno de: ${ESTADOS.join(", ")}` }).optional(),
  sort: sortSchema(["id"]),
  ...paginacion,
});
