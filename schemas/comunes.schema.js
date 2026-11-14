import { z } from "zod";

// Piezas de validación compartidas por los schemas de todas las entidades.

export const entero = (campo) =>
  z.coerce
    .number({ error: `${campo} debe ser un número` })
    .int(`${campo} debe ser un número entero`)
    .positive(`${campo} debe ser mayor a 0`);

// /<recurso>/:id
export const idParamSchema = z.object({
  id: entero("El id"),
});

// page y limit de los listados (por defecto 1 y 20 en el caso de uso; limit máximo 100).
export const paginacion = {
  page: entero("page").optional(),
  limit: entero("limit").max(100, "limit no puede ser mayor a 100").optional(),
};

// sort: uno de los campos permitidos, con o sin "-" (descendente).
export const sortSchema = (campos) => {
  const valores = campos.flatMap((campo) => [campo, `-${campo}`]);
  return z.enum(valores, { error: `sort debe ser uno de: ${valores.join(", ")}` }).optional();
};

// Cantidad de material: número >= 0 con a lo sumo 2 decimales (design D4 de persistencia-materiales).
const tieneHastaDosDecimales = (valor) => Math.abs(Math.round(valor * 100) - valor * 100) < 1e-9;

export const cantidad = (campo) =>
  z
    .number({ error: `${campo} debe ser un número` })
    .nonnegative(`${campo} no puede ser negativo`)
    .refine(tieneHastaDosDecimales, `${campo} puede tener hasta 2 decimales`);

// Booleano que llega como texto en la query (?bajoStock=true).
export const booleanoQuery = (campo) =>
  z
    .enum(["true", "false"], { error: `${campo} debe ser 'true' o 'false'` })
    .transform((valor) => valor === "true");
