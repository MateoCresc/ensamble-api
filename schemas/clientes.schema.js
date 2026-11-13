import { z } from "zod";

// Schemas de entrada de Clientes (design D4). Validan forma y normalizan; las reglas de negocio
// (por ejemplo, email único) viven en los casos de uso.

const SORTS = ["id", "-id", "nombre", "-nombre", "email", "-email"];

const fields = {
  nombre: z
    .string({ error: "El nombre es obligatorio y debe ser texto" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre puede tener hasta 100 caracteres"),
  // Se normaliza (trim + minúsculas) antes de validar el formato: así se guarda siempre en minúsculas.
  email: z
    .string({ error: "El email es obligatorio y debe ser texto" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "El email no tiene un formato válido" })),
  telefono: z
    .string({ error: "El teléfono debe ser texto o null" })
    .trim()
    .regex(/^[0-9+\-\s]{6,20}$/, "El teléfono debe tener de 6 a 20 caracteres: dígitos, espacios, + o -")
    .nullable(),
};

const entero = (campo) =>
  z.coerce
    .number({ error: `${campo} debe ser un número` })
    .int(`${campo} debe ser un número entero`)
    .positive(`${campo} debe ser mayor a 0`);

// POST /clientes
export const crearClienteSchema = z.object({
  nombre: fields.nombre,
  email: fields.email,
  telefono: fields.telefono.default(null),
});

// PUT /clientes/:id — actualización parcial: todos opcionales, pero al menos uno.
export const actualizarClienteSchema = z
  .object({
    nombre: fields.nombre.optional(),
    email: fields.email.optional(),
    telefono: fields.telefono.optional(),
  })
  .refine((cambios) => Object.keys(cambios).length > 0, {
    message: "Enviá al menos uno de estos campos: nombre, email o telefono",
  });

// /clientes/:id
export const clienteIdParamSchema = z.object({
  id: entero("El id"),
});

// GET /clientes — filtros, orden y paginación
export const listarClientesQuerySchema = z.object({
  nombre: z.string().trim().min(1, "El filtro nombre no puede estar vacío").optional(),
  email: z.string().trim().min(1, "El filtro email no puede estar vacío").optional(),
  sort: z.enum(SORTS, { error: `sort debe ser uno de: ${SORTS.join(", ")}` }).optional(),
  page: entero("page").optional(),
  limit: entero("limit").max(100, "limit no puede ser mayor a 100").optional(),
});
