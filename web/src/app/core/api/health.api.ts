import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class HealthApi {
  private readonly http = inject(HttpClient);

  /** true si GET /health responde 2xx; false ante cualquier error (red, proxy o 5xx). */
  estaDisponible(): Observable<boolean> {
    return this.http.get(`${API_BASE}/health`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
