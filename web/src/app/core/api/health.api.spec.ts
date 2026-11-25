import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { HealthApi } from './health.api';

describe('HealthApi.estaDisponible', () => {
  let api: HealthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(HealthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('API disponible: GET /api/health con 200 devuelve true', async () => {
    const resultado = firstValueFrom(api.estaDisponible());

    const req = http.expectOne('/api/health');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok', persistence: 'memory' });

    expect(await resultado).toBe(true);
  });

  it('API caída: un error de red devuelve false', async () => {
    const resultado = firstValueFrom(api.estaDisponible());

    http.expectOne('/api/health').error(new ProgressEvent('error'), { status: 0 });

    expect(await resultado).toBe(false);
  });

  it('API caída: una respuesta 5xx del proxy devuelve false', async () => {
    const resultado = firstValueFrom(api.estaDisponible());

    http.expectOne('/api/health').flush('Bad Gateway', { status: 504, statusText: 'Gateway Timeout' });

    expect(await resultado).toBe(false);
  });
});
