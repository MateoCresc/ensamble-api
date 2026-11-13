# ensamble-api

TP2 Proyecto Integrador — **Ensamble, Taller a Medida**.

API REST para un taller de fabricación a medida (carpintería / herrería), construida con arquitectura en capas.

## Dominio

- **Cliente** (1) — (N) **Encargo**
- **Encargo** (N) — (N) **Material**, a través de `EncargoMaterial { encargoId, materialId, cantidad }`
- Estados de un encargo: `presupuestado → confirmado → en_produccion → entregado`, o `cancelado`.
- Regla central: al confirmar un encargo se descuenta el stock de todos sus materiales de forma atómica; si falta stock responde `409 STOCK_INSUFICIENTE`.

## Arquitectura

```
index.js → container/ → routes/ → controllers/ → usecases/ → dao/
```

| Carpeta        | Responsabilidad                                                     |
| -------------- | ------------------------------------------------------------------- |
| `config/`      | Único lugar que lee `process.env`                                   |
| `container/`   | Composition Root: arma dependencias y devuelve el router principal |
| `routes/`      | Definición de endpoints                                             |
| `controllers/` | Traducción HTTP ↔ casos de uso                                      |
| `usecases/`    | Lógica de negocio                                                   |
| `dao/`         | Acceso a datos (Memory y Sequelize con la misma interfaz)           |
| `schemas/`     | Schemas de validación (Zod)                                         |
| `middlewares/` | `logger`, `validate`, `notFound`, `errorHandler`                    |
| `errors/`      | `AppError`                                                          |
| `docs/`        | Especificación OpenAPI y montaje de Swagger UI                      |

## Requisitos

- Node.js **22.12 o superior** (lo exige Vitest 5; la app usa `node --env-file`, disponible desde Node 20.6).

## Instalación

```bash
npm install
cp .env.example .env
npm start        # o: npm run dev (reinicia al guardar)
```

## Variables de entorno

| Variable           | Valores                     | Por defecto   | Descripción                    |
| ------------------ | --------------------------- | ------------- | ------------------------------ |
| `PORT`             | número                      | `3000`        | Puerto HTTP                    |
| `NODE_ENV`         | `development`, `production` | `development` | Entorno de ejecución           |
| `PERSISTENCE_TYPE` | `memory`, `sequelize`       | `memory`      | Tipo de persistencia de la API |

## Endpoints

| Método | Ruta             | Descripción                                    |
| ------ | ---------------- | ---------------------------------------------- |
| GET    | `/health`        | Estado del servicio y persistencia configurada |
| GET    | `/api-docs`      | Documentación interactiva (Swagger UI)         |
| GET    | `/api-docs.json` | Especificación OpenAPI 3 en JSON               |

## Formato de errores

Todas las respuestas de error tienen la forma:

```json
{ "error": { "code": "NOT_FOUND", "message": "Ruta no encontrada: GET /no-existe" } }
```

`details` aparece solo cuando hay información adicional (por ejemplo, en `VALIDATION_ERROR`, como lista de `{ field, message }`).

## Tests

Los tests usan [Vitest](https://vitest.dev/) y [supertest](https://github.com/ladjs/supertest). No necesitan `.env` ni levantan un servidor: los tests HTTP arman la app con `createApp()` (en `app.js`) y persistencia en memoria.

```bash
npm test               # una corrida de toda la suite
npm run test:watch     # modo watch, vuelve a correr al guardar
npm run test:coverage  # corrida con reporte de cobertura en coverage/
```

```
tests/
  unit/        ← reglas de negocio y middlewares, sin base de datos ni process.env
                 (casos de uso en unit/usecases/<entidad>/<casoDeUso>.test.js)
  http/        ← endpoints de punta a punta con supertest (<entidad>.http.test.js)
  helpers/     ← builders y fábricas de datos de prueba (p. ej. buildTestApp)
```

`buildTestApp(options)` (en `tests/helpers/`) arma la app con `persistenceType: "memory"` por defecto; se le puede pasar otra opción para probar otro modo, por ejemplo `buildTestApp({ persistenceType: "sequelize" })`.

## Verificación manual

El archivo [`requests.http`](requests.http) tiene los pedidos de prueba (extensión REST Client de VS Code). También se pueden probar desde Swagger UI con *Try it out*.
