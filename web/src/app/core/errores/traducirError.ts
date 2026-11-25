import { HttpErrorResponse } from '@angular/common/http';

export interface AvisoError {
  severidad: 'error' | 'warn';
  titulo: string;
  detalle: string;
  codigo?: string;
}

interface DetalleValidacion {
  field: string;
  message: string;
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null;

const esErrorApi = (cuerpo: unknown): cuerpo is { error: { code: string; message: string; details?: unknown } } =>
  esObjeto(cuerpo) &&
  esObjeto(cuerpo['error']) &&
  typeof cuerpo['error']['code'] === 'string' &&
  typeof cuerpo['error']['message'] === 'string';

const esDetalleValidacion = (d: unknown): d is DetalleValidacion =>
  esObjeto(d) && typeof d['field'] === 'string' && typeof d['message'] === 'string';

interface FaltanteStock {
  nombre: string;
  requerido: number;
  disponible: number;
}

const esFaltanteStock = (d: unknown): d is FaltanteStock =>
  esObjeto(d) &&
  typeof d['nombre'] === 'string' &&
  typeof d['requerido'] === 'number' &&
  typeof d['disponible'] === 'number';

const lineasDeDetalle = (code: string, details: unknown): string[] => {
  if (!Array.isArray(details)) return [];
  if (code === 'VALIDATION_ERROR') {
    return details.filter(esDetalleValidacion).map((d) => `${d.field}: ${d.message}`);
  }
  if (code === 'STOCK_INSUFICIENTE') {
    return details.filter(esFaltanteStock).map((d) => `${d.nombre}: requiere ${d.requerido}, hay ${d.disponible}`);
  }
  return [];
};

/** Traduce una respuesta de error HTTP en un aviso legible (design D5). Función pura. */
// Con el proxy de desarrollo (design D2), si la API está apagada el navegador no recibe status 0
// sino un 502/503/504 del propio proxy, sin el cuerpo { error } de la API.
const PROXY_SIN_API = [502, 503, 504];

const sinConexion = (): AvisoError => ({
  severidad: 'error',
  titulo: 'No se pudo conectar con la API',
  detalle: 'Verificá que la API esté levantada en http://localhost:3000.',
});

export const traducirError = (respuesta: HttpErrorResponse): AvisoError => {
  if (respuesta.status === 0) return sinConexion();

  const cuerpo: unknown = respuesta.error;
  if (!esErrorApi(cuerpo) && PROXY_SIN_API.includes(respuesta.status)) return sinConexion();

  if (esErrorApi(cuerpo)) {
    const { code, message, details } = cuerpo.error;
    return {
      severidad: 'error',
      titulo: message,
      codigo: code,
      detalle: [`Código: ${code}`, ...lineasDeDetalle(code, details)].join('\n'),
    };
  }

  return {
    severidad: 'error',
    titulo: `Error inesperado (${respuesta.status})`,
    detalle: respuesta.statusText || 'La API respondió con un formato desconocido.',
  };
};
