import { HttpErrorResponse } from '@angular/common/http';
import { traducirError } from './traducirError';

const respuesta = (status: number, error: unknown) =>
  new HttpErrorResponse({ status, error, url: '/api/clientes' });

describe('traducirError', () => {
  it('Regla de negocio rechazada: muestra el message como título y el code EMAIL_DUPLICADO', () => {
    const aviso = traducirError(
      respuesta(409, { error: { code: 'EMAIL_DUPLICADO', message: 'Ya existe un cliente con ese email' } }),
    );

    expect(aviso.severidad).toBe('error');
    expect(aviso.titulo).toBe('Ya existe un cliente con ese email');
    expect(aviso.codigo).toBe('EMAIL_DUPLICADO');
    expect(aviso.detalle).toContain('EMAIL_DUPLICADO');
  });

  it('Error de validación con detalles: incluye una línea "campo: mensaje" por cada detalle', () => {
    const aviso = traducirError(
      respuesta(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: [
            { field: 'email', message: 'El email no tiene un formato válido' },
            { field: 'nombre', message: 'El nombre debe tener al menos 2 caracteres' },
          ],
        },
      }),
    );

    expect(aviso.titulo).toBe('Datos inválidos');
    expect(aviso.codigo).toBe('VALIDATION_ERROR');
    expect(aviso.detalle).toContain('email: El email no tiene un formato válido');
    expect(aviso.detalle).toContain('nombre: El nombre debe tener al menos 2 caracteres');
  });

  it('Confirmación sin stock: STOCK_INSUFICIENTE lista una línea por material con requerido y disponible', () => {
    const aviso = traducirError(
      respuesta(409, {
        error: {
          code: 'STOCK_INSUFICIENTE',
          message: 'No hay stock suficiente para confirmar el encargo',
          details: [
            { materialId: 1, nombre: 'Tablón de pino', requerido: 10, disponible: 4.5 },
            { materialId: 2, nombre: 'Tornillos', requerido: 50, disponible: 0 },
          ],
        },
      }),
    );

    expect(aviso.titulo).toBe('No hay stock suficiente para confirmar el encargo');
    expect(aviso.codigo).toBe('STOCK_INSUFICIENTE');
    expect(aviso.detalle).toContain('Tablón de pino: requiere 10, hay 4.5');
    expect(aviso.detalle).toContain('Tornillos: requiere 50, hay 0');
  });

  it('Sin conexión con la API: status 0 indica que no se pudo conectar', () => {
    const aviso = traducirError(respuesta(0, new ProgressEvent('error')));

    expect(aviso.severidad).toBe('error');
    expect(aviso.titulo).toBe('No se pudo conectar con la API');
  });

  it.each([502, 503, 504])(
    'Sin conexión con la API: un %i del proxy de desarrollo (API apagada) indica que no se pudo conectar',
    (status) => {
      const aviso = traducirError(respuesta(status, 'Error occurred while trying to proxy: localhost:4200/clientes'));

      expect(aviso.titulo).toBe('No se pudo conectar con la API');
      expect(aviso.codigo).toBeUndefined();
    },
  );

  it('cuerpo desconocido: muestra "Error inesperado" con el status', () => {
    const aviso = traducirError(respuesta(500, '<html>Internal Server Error</html>'));

    expect(aviso.titulo).toBe('Error inesperado (500)');
    expect(aviso.codigo).toBeUndefined();
  });
});
