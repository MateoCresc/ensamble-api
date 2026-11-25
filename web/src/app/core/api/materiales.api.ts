import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Material, MaterialInput } from '../modelos';
import { API_BASE, queryParams } from './api-base';

const URL = `${API_BASE}/materiales`;

export interface FiltrosMateriales {
  nombre?: string;
  bajoStock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MaterialesApi {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosMateriales = {}): Observable<Material[]> {
    return this.http.get<Material[]>(URL, { params: queryParams({ ...filtros }) });
  }

  crear(body: MaterialInput): Observable<Material> {
    return this.http.post<Material>(URL, body);
  }

  actualizar(id: number, cambios: Partial<MaterialInput>): Observable<Material> {
    return this.http.put<Material>(`${URL}/${id}`, cambios);
  }

  eliminar(id: number): Observable<null> {
    return this.http.delete<null>(`${URL}/${id}`);
  }
}
