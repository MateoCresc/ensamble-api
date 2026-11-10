# Tasks

## 1. Herramientas de testing

- [x] 1.1 Instalar `vitest`, `@vitest/coverage-v8` y `supertest` como devDependencies (previa aprobación del autor); verificar que figuran en `package.json` bajo `devDependencies`
- [x] 1.2 Agregar los scripts `test` (`vitest run`), `test:watch` (`vitest`) y `test:coverage` (`vitest run --coverage`) y crear `vitest.config.js` (D3); verificar que `npm test` corre y reporta "No test files found"
- [x] 1.3 Crear `tests/unit/`, `tests/http/` y `tests/helpers/` (con `.gitkeep` donde queden vacías) y agregar `coverage/` a `.gitignore`; verificar con `git status`
- [x] 1.4 Detenerse, mostrar resumen y proponer mensaje de commit (sin commitear)

## 2. createApp y tests HTTP de estado

- [x] 2.1 Escribir `tests/http/health.http.test.js` con los escenarios de `estado-servicio` ("servicio activo en memoria" y "servicio activo con base de datos" vía `createApp({ persistenceType })`); verificar que falla porque `app.js` no existe
- [x] 2.2 Crear `app.js` con `createApp(options)` (D1) y hacer que `buildContainer` acepte `{ persistenceType }` con default de config (D2); verificar que los tests de 2.1 pasan
- [x] 2.3 Reducir `index.js` a `createApp()` + `listen` con salida del proceso ante error; verificar que `npm start` levanta y `GET /health` responde igual que antes
- [x] 2.4 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## 3. Tests de manejo de errores

- [x] 3.1 Escribir `tests/http/errores.http.test.js` con los escenarios "ruta no definida" (404 `NOT_FOUND` con método y ruta en el mensaje) y "JSON inválido" (400 `INVALID_JSON`); validar el rojo según D5
- [x] 3.2 Escribir `tests/unit/middlewares/errorHandler.test.js` con "error de dominio con detalles", "error de dominio sin detalles" (sin clave `details`) y "excepción no controlada" (500 sin stack, D4); validar el rojo según D5
- [x] 3.3 Escribir `tests/unit/middlewares/validate.test.js`: body inválido → 400 `VALIDATION_ERROR` con `details[{ field, message }]`; query válida reemplazada por el dato parseado; target inválido lanza error al construir; validar el rojo según D5
- [x] 3.4 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## 4. Tests de documentación y cierre

- [x] 4.1 Escribir `tests/http/docs.http.test.js` con "acceso a la documentación" (`GET /api-docs/` → 200 HTML) y "descarga de la especificación" (`GET /api-docs.json` → `openapi` empieza con `3.`), y verificar que toda respuesta de error documentada en la spec usa `$ref: '#/components/schemas/Error'` o `ErrorValidacion`; validar el rojo según D5
- [x] 4.2 Crear `tests/helpers/` con una función `buildTestApp(options)` que envuelva `createApp({ persistenceType: "memory", ...options })` y usarla en los tests HTTP; verificar que la suite sigue en verde
- [x] 4.3 Documentar en `README.md` los comandos de test y la estructura de `tests/`; verificar `npm run test:coverage` genera el reporte
- [x] 4.4 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## Workflow follow-up

- Archivar `base-proyecto` con `/opsx:archive` (sus escenarios ya quedan cubiertos por tests).
- Archivar `infraestructura-tests` cuando el autor lo apruebe.
