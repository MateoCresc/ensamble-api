import { EncargoInput, EncargoUpdate, EstadoEncargo, RenglonInput } from '../core/modelos';

// Reglas de presentación del ciclo de vida (design D4). Copia deliberada de TRANSICIONES, EDITABLES
// y ELIMINABLES de usecases/encargos/estados.js en la API: si divergen, la API responde 409
// TRANSICION_INVALIDA y la UI lo muestra como aviso.

export type AccionCiclo = 'confirmar' | 'cancelar' | 'iniciar' | 'entregar';
export type Severidad = 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface ReglasEstado {
  acciones: AccionCiclo[];
  editable: boolean;
  eliminable: boolean;
  severidad: Severidad;
}

export const ACCIONES_POR_ESTADO: Record<EstadoEncargo, ReglasEstado> = {
  presupuestado: { acciones: ['confirmar', 'cancelar'], editable: true, eliminable: true, severidad: 'info' },
  confirmado: { acciones: ['iniciar', 'cancelar'], editable: false, eliminable: false, severidad: 'warn' },
  en_produccion: { acciones: ['entregar'], editable: false, eliminable: false, severidad: 'contrast' },
  entregado: { acciones: [], editable: false, eliminable: false, severidad: 'success' },
  cancelado: { acciones: [], editable: false, eliminable: true, severidad: 'danger' },
};

export const ETIQUETA_ACCION: Record<AccionCiclo, { label: string; icon: string; severidad: Severidad }> = {
  confirmar: { label: 'Confirmar', icon: 'pi pi-check', severidad: 'success' },
  cancelar: { label: 'Cancelar', icon: 'pi pi-ban', severidad: 'danger' },
  iniciar: { label: 'Iniciar', icon: 'pi pi-play', severidad: 'info' },
  entregar: { label: 'Entregar', icon: 'pi pi-send', severidad: 'success' },
};

export const ETIQUETA_ESTADO: Record<EstadoEncargo, string> = {
  presupuestado: 'Presupuestado',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const accionesDisponibles = (estado: EstadoEncargo): AccionCiclo[] => [...ACCIONES_POR_ESTADO[estado].acciones];

export const esEditable = (estado: EstadoEncargo): boolean => ACCIONES_POR_ESTADO[estado].editable;

export const esEliminable = (estado: EstadoEncargo): boolean => ACCIONES_POR_ESTADO[estado].eliminable;

export const severidadEstado = (estado: EstadoEncargo): Severidad => ACCIONES_POR_ESTADO[estado].severidad;

export interface RenglonFormulario {
  materialId: number | null;
  cantidad: number | null;
}

export interface FormularioEncargo {
  clienteId: number | null;
  descripcion: string;
  fechaEntregaEstimada: Date | null;
  materiales: RenglonFormulario[];
}

/** true si dos renglones eligieron el mismo material (spec "Material repetido en el formulario"). */
export const tieneMaterialesRepetidos = (renglones: RenglonFormulario[]): boolean => {
  const elegidos = renglones.map((r) => r.materialId).filter((id): id is number => id !== null);
  return new Set(elegidos).size !== elegidos.length;
};

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Fecha local → AAAA-MM-DD (sin pasar por UTC, para no correr el día). */
const aFechaIso = (fecha: Date): string =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

const aRenglones = (renglones: RenglonFormulario[]): RenglonInput[] =>
  renglones
    .filter((r): r is { materialId: number; cantidad: number | null } => r.materialId !== null)
    .map((r) => ({ materialId: r.materialId, cantidad: r.cantidad ?? 0 }));

/** Arma el body de POST/PUT /encargos desde el formulario (design D7). Al editar se omite clienteId. */
export function armarBodyEncargo(f: FormularioEncargo, o: { edicion: false }): EncargoInput;
export function armarBodyEncargo(f: FormularioEncargo, o: { edicion: true }): EncargoUpdate;
export function armarBodyEncargo(f: FormularioEncargo, { edicion }: { edicion: boolean }): EncargoInput | EncargoUpdate {
  const cambios: EncargoUpdate = {
    descripcion: f.descripcion.trim(),
    fechaEntregaEstimada: f.fechaEntregaEstimada ? aFechaIso(f.fechaEntregaEstimada) : null,
    materiales: aRenglones(f.materiales),
  };
  return edicion ? cambios : { clienteId: f.clienteId as number, ...cambios };
}
