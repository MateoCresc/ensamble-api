// Tipos del dominio tal como los devuelve la API (ver docs/openapi.yaml de la raíz).

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
}

export type ClienteInput = Omit<Cliente, 'id'>;

export const UNIDADES = ['unidad', 'm', 'm2', 'kg', 'l'] as const;
export type Unidad = (typeof UNIDADES)[number];

export interface Material {
  id: number;
  nombre: string;
  unidad: Unidad;
  stock: number;
  stockMinimo: number;
}

export type MaterialInput = Omit<Material, 'id'>;

export const ESTADOS_ENCARGO = ['presupuestado', 'confirmado', 'en_produccion', 'entregado', 'cancelado'] as const;
export type EstadoEncargo = (typeof ESTADOS_ENCARGO)[number];

export interface EncargoMaterial {
  materialId: number;
  nombre: string;
  unidad: Unidad;
  cantidad: number;
}

export interface Encargo {
  id: number;
  clienteId: number;
  cliente: { id: number; nombre: string };
  descripcion: string;
  estado: EstadoEncargo;
  fechaEntregaEstimada: string | null;
  materiales: EncargoMaterial[];
}

export interface RenglonInput {
  materialId: number;
  cantidad: number;
}

export interface EncargoInput {
  clienteId: number;
  descripcion: string;
  fechaEntregaEstimada: string | null;
  materiales: RenglonInput[];
}

export type EncargoUpdate = Omit<EncargoInput, 'clienteId'>;

/** Cuerpo de error de la API: { error: { code, message, details? } } */
export interface ErrorApi {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
