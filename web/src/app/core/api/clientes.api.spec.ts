import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Cliente } from '../modelos';
import { ClientesApi } from './clientes.api';

const ana: Cliente = { id: 1, nombre: 'Ana Pérez', email: 'ana@mail.com', telefono: null };

describe('ClientesApi', () => {
  let api: ClientesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ClientesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listar', () => {
    it('envía GET /api/clientes sin query cuando no hay filtro', async () => {
      const resultado = firstValueFrom(api.listar());

      const req = http.expectOne((r) => r.url === '/api/clientes');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([ana]);

      expect(await resultado).toEqual([ana]);
    });

    it('envía el filtro por nombre como ?nombre=', () => {
      api.listar({ nombre: 'ana' }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/clientes');
      expect(req.request.params.get('nombre')).toBe('ana');
      req.flush([]);
    });

    it('no envía el filtro de nombre si está vacío o en blanco', () => {
      api.listar({ nombre: '   ' }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/clientes');
      expect(req.request.params.has('nombre')).toBe(false);
      req.flush([]);
    });
  });

  it('Alta de cliente: envía POST /api/clientes con el body y devuelve el creado', async () => {
    const body = { nombre: 'Ana Pérez', email: 'ana@mail.com', telefono: null };
    const resultado = firstValueFrom(api.crear(body));

    const req = http.expectOne('/api/clientes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(ana, { status: 201, statusText: 'Created' });

    expect(await resultado).toEqual(ana);
  });

  it('Edición de cliente: envía PUT /api/clientes/:id con los cambios', async () => {
    const resultado = firstValueFrom(api.actualizar(1, { telefono: '1155550000' }));

    const req = http.expectOne('/api/clientes/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ telefono: '1155550000' });
    req.flush({ ...ana, telefono: '1155550000' });

    expect((await resultado).telefono).toBe('1155550000');
  });

  it('eliminar: envía DELETE /api/clientes/:id', async () => {
    const resultado = firstValueFrom(api.eliminar(7));

    const req = http.expectOne('/api/clientes/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(resultado).resolves.toBeNull();
  });
});
