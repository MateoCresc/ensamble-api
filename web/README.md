# Ensamble — interfaz web

Aplicación Angular 22 + PrimeNG para operar la API de Ensamble. Instalación, arranque conjunto (`npm run dev:all`) y proxy `/api`: ver el [README de la raíz](../README.md#interfaz-web).

```bash
npm start       # ng serve con proxy a http://localhost:3000 (la API tiene que estar levantada)
npm test        # tests de dominio/, core/errores/ y core/api/ (Vitest + jsdom)
npm run build   # build de producción en dist/
```

```
src/app/
  core/api/       servicios HTTP (HttpClient) y API_BASE
  core/errores/   traducirError (puro) + interceptor que muestra el aviso
  core/modelos.ts tipos de la API
  dominio/        reglas de presentación puras (ciclo de vida, stock bajo, armado de bodies)
  features/       pantallas de clientes, materiales y encargos
  layout/         barra de navegación, indicador de API, avisos y confirmaciones
```
