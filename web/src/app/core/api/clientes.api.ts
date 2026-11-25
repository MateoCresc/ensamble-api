import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente, ClienteInput } from '../modelos';
import { API_BASE, queryParams } from './api-base';

const URL = `${API_BASE}/clientes`;

@Injectable({ providedIn: 'root' })
export class ClientesApi {
  private readonly http = inject(HttpClient);

  listar(filtros: { nombre?: string } = {}): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(URL, { params: queryParams(filtros) });
  }

  crear(body: ClienteInput): Observable<Cliente> {
    return this.http.post<Cliente>(URL, body);
  }

  actualizar(id: number, cambios: Partial<ClienteInput>): Observable<Cliente> {
    return this.http.put<Cliente>(`${URL}/${id}`, cambios);
  }

  eliminar(id: number): Observable<null> {
    return this.http.delete<null>(`${URL}/${id}`);
  }
}
