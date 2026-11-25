import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Encargo, EncargoInput } from '../modelos';
import { AccionCiclo } from '../../dominio/encargos';
import { EncargosApi } from './encargos.api';

const encargo: Encargo = {
  id: 9,
  clienteId: 1,
  cliente: { id: 1, nombre: 'Ana Pérez' },
  descripcion: 'Mesa de comedor',
  estado: 'presupuestado',
  fechaEntregaEstimada: null,
  materiales: [{ materialId: 3, nombre: 'Tablón de pino', unidad: 'unidad', cantidad: 4 }],
};

describe('EncargosApi', () => {
  let api: EncargosApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(EncargosApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listar', () => {
    it('envía GET /api/encargos sin query cuando no hay filtros', async () => {
      const resultado = firstValueFrom(api.listar());

      const req = http.expectOne((r) => r.url === '/api/encargos');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([encargo]);

      expect(await resultado).toEqual([encargo]);
    });

    it('Filtro por estado: envía ?estado=confirmado', () => {
      api.listar({ estado: 'confirmado' }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/encargos');
      expect(req.request.params.get('estado')).toBe('confirmado');
      expect(req.request.params.has('clienteId')).toBe(false);
      req.flush([]);
    });

    it('envía el filtro por cliente como ?clienteId=', () => {
      api.listar({ estado: null, clienteId: 4 }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/encargos');
      expect(req.request.params.get('clienteId')).toBe('4');
      expect(req.request.params.has('estado')).toBe(false);
      req.flush([]);
    });
  });

  it('Alta con materiales: envía POST /api/encargos con el body', async () => {
    const body: EncargoInput = {
      clienteId: 1,
      descripcion: 'Mesa de comedor',
      fechaEntregaEstimada: '2026-12-05',
      materiales: [{ materialId: 3, cantidad: 4 }],
    };
    const resultado = firstValueFrom(api.crear(body));

    const req = http.expectOne('/api/encargos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(encargo, { status: 201, statusText: 'Created' });

    expect(await resultado).toEqual(encargo);
  });

  it('actualizar: envía PUT /api/encargos/:id con los cambios', () => {
    api.actualizar(9, { descripcion: 'Mesa ratona', fechaEntregaEstimada: null, materiales: [] }).subscribe();

    const req = http.expectOne('/api/encargos/9');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ descripcion: 'Mesa ratona', fechaEntregaEstimada: null, materiales: [] });
    req.flush(encargo);
  });

  it('eliminar: envía DELETE /api/encargos/:id', () => {
    api.eliminar(9).subscribe();

    const req = http.expectOne('/api/encargos/9');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('Confirmación exitosa: envía PUT /api/encargos/:id/confirmar y devuelve el encargo confirmado', async () => {
    const resultado = firstValueFrom(api.ejecutar(9, 'confirmar'));

    const req = http.expectOne('/api/encargos/9/confirmar');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...encargo, estado: 'confirmado' });

    expect((await resultado).estado).toBe('confirmado');
  });

  it.each<AccionCiclo>(['cancelar', 'iniciar', 'entregar'])('envía PUT /api/encargos/:id/%s', (accion) => {
    api.ejecutar(9, accion).subscribe();

    const req = http.expectOne(`/api/encargos/9/${accion}`);
    expect(req.request.method).toBe('PUT');
    req.flush(encargo);
  });
});
