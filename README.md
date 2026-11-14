# ensamble-api

TP2 Proyecto Integrador — **Ensamble, Taller a Medida**.

API REST para un taller de fabricación a medida (carpintería / herrería), construida con arquitectura en capas.

## Dominio

- **Cliente** (1) — (N) **Encargo**
- **Encargo** (N) — (N) **Material**, a través de `EncargoMaterial { encargoId, materialId, cantidad }`
- Estados de un encargo: `presupuestado → confirmado → en_produccion → entregado`, o `cancelado`.
- Regla central: al confirmar un encargo se descuenta el stock de todos sus materiales de forma atómica; si falta stock responde `409 STOCK_INSUFICIENTE`.

### Cliente

Persona o empresa que encarga trabajos al taller. Recurso: `/clientes`.

| Campo      | Tipo            | Reglas                                                              |
| ---------- | --------------- | ------------------------------------------------------------------- |
| `id`       | entero          | Lo asigna el sistema; un `id` enviado en el body se ignora          |
| `nombre`   | texto           | Obligatorio, de 2 a 100 caracteres                                  |
| `email`    | texto           | Obligatorio, formato válido, **único**; se guarda en minúsculas     |
| `telefono` | texto o `null`  | Opcional, de 6 a 20 caracteres (dígitos, espacios, `+` o `-`)       |

- **Regla de negocio (caso de uso):** no puede haber dos clientes con el mismo email, sin distinguir mayúsculas, ni al crear ni al actualizar → `409 EMAIL_DUPLICADO`.
- **Actualización parcial:** `PUT /clientes/:id` modifica solo los campos enviados (al menos uno).
- **Listado:** `GET /clientes` acepta `nombre` (parcial), `email` (exacto), `sort` (`id`, `nombre`, `email`, con `-` para descendente) y `page` / `limit` (máximo 100). Ejemplo: `GET /clientes?nombre=ana&sort=-nombre&page=1&limit=10`.

### Material

Insumo del taller (madera, metal, herrajes). Recurso: `/materiales`.

| Campo         | Tipo    | Reglas                                                                    |
| ------------- | ------- | ------------------------------------------------------------------------- |
| `id`          | entero  | Lo asigna el sistema                                                      |
| `nombre`      | texto   | Obligatorio, de 2 a 100 caracteres, **único** (sin distinguir mayúsculas ni espacios en los extremos) |
| `unidad`      | texto   | `unidad`, `m`, `m2`, `kg` o `l`                                           |
| `stock`       | número  | `>= 0`, hasta 2 decimales, por defecto 0                                  |
| `stockMinimo` | número  | `>= 0`, hasta 2 decimales, por defecto 0                                  |

- **Regla de negocio (caso de uso):** nombre repetido al crear o actualizar → `409 MATERIAL_DUPLICADO`.
- **Listado:** `GET /materiales` acepta `nombre` (parcial), `unidad`, `bajoStock=true|false` (stock menor o igual al mínimo), `sort` (`id`, `nombre`, `stock`, con `-` para descendente) y `page` / `limit`.

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
| `dao/`         | Acceso a datos: un DAO en memoria y uno Sequelize por entidad, con la misma interfaz; `daoFactory.js` elige cuál usar y `models/` define las tablas y sus asociaciones |
| `connection/`  | Crea la conexión Sequelize a SQLite                                 |
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
| `DB_STORAGE`       | ruta de archivo             | `./ensamble.sqlite` | Archivo SQLite (solo con `sequelize`) |
| `DB_LOGGING`       | `true`, `false`             | `false`       | Muestra el SQL que ejecuta Sequelize |

## Cambiar de persistencia

La persistencia se elige con `PERSISTENCE_TYPE` en `.env` y **no requiere tocar rutas, controladores ni casos de uso**: el contenedor le pide los DAOs a `dao/daoFactory.js`, que devuelve los de memoria o los de Sequelize con la misma interfaz.

```bash
# En memoria (por defecto): cada arranque empieza sin datos
PERSISTENCE_TYPE=memory

# Base de datos SQLite: los datos se guardan en DB_STORAGE y sobreviven a los reinicios
PERSISTENCE_TYPE=sequelize
DB_STORAGE=./ensamble.sqlite
```

Reiniciá el servidor y comprobá el modo activo con `GET /health` (`"persistence": "sequelize"`). Las tablas se crean solas al arrancar. Si durante el desarrollo cambia el esquema de una tabla, borrá el archivo `.sqlite` para que se vuelva a crear.

Los tests HTTP de clientes y materiales corren **la misma suite en ambos modos**, que es la prueba de que responden igual.

## Endpoints

El detalle de todos los endpoints (parámetros, cuerpos, ejemplos y errores) está en Swagger UI: **`/api-docs`**. Acá solo los de infraestructura:

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
