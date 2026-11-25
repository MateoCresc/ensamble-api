import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { API_BASE } from '../api/api-base';
import { traducirError } from './traducirError';

// Publica cada error de la API como toast (design D5) y lo relanza, para que la página
// no cierre el diálogo ni pierda el formulario. /health se excluye: su falla se ve en el indicador.
export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const mensajes = inject(MessageService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && !req.url.startsWith(`${API_BASE}/health`)) {
        const aviso = traducirError(err);
        mensajes.add({ severity: aviso.severidad, summary: aviso.titulo, detail: aviso.detalle, life: 8000 });
      }
      return throwError(() => err);
    }),
  );
};
