import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Material, MaterialInput } from '../modelos';
import { MaterialesApi } from './materiales.api';

const pino: Material = { id: 3, nombre: 'Tablón de pino', unidad: 'unidad', stock: 12.5, stockMinimo: 3 };

describe('MaterialesApi', () => {
  let api: MaterialesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(MaterialesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listar', () => {
    it('envía GET /api/materiales sin query cuando no hay filtros', async () => {
      const resultado = firstValueFrom(api.listar());

      const req = http.expectOne((r) => r.url === '/api/materiales');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([pino]);

      expect(await resultado).toEqual([pino]);
    });

    it('envía los filtros nombre y bajoStock=true como query', () => {
      api.listar({ nombre: 'pino', bajoStock: true }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/materiales');
      expect(req.request.params.get('nombre')).toBe('pino');
      expect(req.request.params.get('bajoStock')).toBe('true');
      req.flush([]);
    });

    it('no envía bajoStock cuando el filtro está desactivado', () => {
      api.listar({ nombre: '', bajoStock: false }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/materiales');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([]);
    });
  });

  it('Alta de material: envía POST /api/materiales con el body y devuelve el creado', async () => {
    const body: MaterialInput = { nombre: 'Tablón de pino', unidad: 'unidad', stock: 12.5, stockMinimo: 3 };
    const resultado = firstValueFrom(api.crear(body));

    const req = http.expectOne('/api/materiales');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(pino, { status: 201, statusText: 'Created' });

    expect(await resultado).toEqual(pino);
  });

  it('actualizar: envía PUT /api/materiales/:id con los cambios', async () => {
    const resultado = firstValueFrom(api.actualizar(3, { stock: 20 }));

    const req = http.expectOne('/api/materiales/3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ stock: 20 });
    req.flush({ ...pino, stock: 20 });

    expect((await resultado).stock).toBe(20);
  });

  it('eliminar: envía DELETE /api/materiales/:id', async () => {
    const resultado = firstValueFrom(api.eliminar(3));

    const req = http.expectOne('/api/materiales/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(resultado).resolves.toBeNull();
  });
});
