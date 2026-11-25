import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Encargo, EncargoInput, EncargoUpdate, EstadoEncargo } from '../modelos';
import { AccionCiclo } from '../../dominio/encargos';
import { API_BASE, queryParams } from './api-base';

const URL = `${API_BASE}/encargos`;

export interface FiltrosEncargos {
  estado?: EstadoEncargo | null;
  clienteId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class EncargosApi {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosEncargos = {}): Observable<Encargo[]> {
    return this.http.get<Encargo[]>(URL, { params: queryParams({ ...filtros }) });
  }

  crear(body: EncargoInput): Observable<Encargo> {
    return this.http.post<Encargo>(URL, body);
  }

  actualizar(id: number, cambios: EncargoUpdate): Observable<Encargo> {
    return this.http.put<Encargo>(`${URL}/${id}`, cambios);
  }

  eliminar(id: number): Observable<null> {
    return this.http.delete<null>(`${URL}/${id}`);
  }

  /** PUT /encargos/:id/{confirmar|cancelar|iniciar|entregar} — sin body. */
  ejecutar(id: number, accion: AccionCiclo): Observable<Encargo> {
    return this.http.put<Encargo>(`${URL}/${id}/${accion}`, null);
  }
}
