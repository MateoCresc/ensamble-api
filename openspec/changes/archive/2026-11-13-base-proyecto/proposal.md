# Proposal

## Why

Antes de modelar clientes, materiales y encargos, la API necesita un esqueleto que ya respete la arquitectura en capas que pide la consigna: un servidor que arranque desde un `index.js` limpio, configuración centralizada, un contenedor que ensamble dependencias y un manejo de errores uniforme. Hacerlo primero permite que cada change de entidad solo sume su capa propia, sin rehacer infraestructura.

Cubre los requisitos de la consigna 2.1 (servidor y estructura), 2.3 (errores centralizados, `notFound`, formato consistente) y la base de 2.7 (Swagger UI en `/api-docs`).

## What Changes

- Proyecto Node.js con ES Modules y Express 5, scripts `start` y `dev` que cargan variables con `--env-file`.
- Estructura de carpetas por responsabilidad: `routes/`, `controllers/`, `usecases/`, `dao/`, `schemas/`, `middlewares/`, `errors/`, `config/`, `container/`, `docs/`.
- `config/config.js` como único lector de variables de entorno, con `.env.example` versionado y `.env` ignorado.
- Clase `AppError` y middlewares `errorHandler`, `notFound`, `logger` y `validate` (Zod, reutilizable para body, params y query).
- `container/container.js` como Composition Root, que por ahora solo monta el endpoint de estado y la documentación.
- Endpoint `GET /health` que informa que el servicio está activo y qué persistencia está configurada.
- Documentación OpenAPI 3 en `docs/openapi.yaml`, publicada con Swagger UI en `/api-docs`, con el schema de error reutilizable.
- `.gitignore` (node_modules, .env, *.sqlite) y `.gitattributes` para normalizar fines de línea.

## Capabilities

### New Capabilities
- `manejo-errores`: formato único de respuesta de error, rutas inexistentes (404), cuerpo JSON mal formado (400) y errores inesperados (500).
- `estado-servicio`: endpoint de salud que indica si la API está activa y con qué tipo de persistencia corre.
- `documentacion-api`: publicación de la especificación OpenAPI y de Swagger UI.

### Modified Capabilities
<!-- Ninguna: es el primer change del proyecto. -->

## Impact

- Código nuevo en la raíz del repo; no hay código previo afectado.
- Dependencias: `express`, `zod`, `swagger-ui-express`, `yaml`.
- Fuera de alcance: entidades del dominio, DAOs y factory de persistencia (llegan con `clientes-crud` y `persistencia-sequelize`), eventos, autenticación y tests automatizados.
