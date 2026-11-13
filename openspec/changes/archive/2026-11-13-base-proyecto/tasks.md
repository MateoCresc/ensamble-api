# Tasks

## 1. Andamiaje del proyecto

- [x] 1.1 Crear `package.json` (type module, scripts `start` y `dev` con `--env-file=.env`, engines node >=20.6) e instalar `express`, `zod`, `swagger-ui-express` y `yaml`; verificar que `npm install` termina sin errores
- [x] 1.2 Crear `.gitignore` (node_modules, .env, *.sqlite, *.log) y `.gitattributes` (`* text=auto eol=lf`); verificar con `git status` que `node_modules/` no aparece
- [x] 1.3 Crear las carpetas `routes/`, `controllers/`, `usecases/`, `dao/`, `schemas/` con `.gitkeep` donde queden vacías; verificar que `git status` las muestra

## 2. Configuración

- [x] 2.1 Crear `config/config.js` que exporte `PORT`, `NODE_ENV` y `PERSISTENCE_TYPE` con valores por defecto; verificar que es el único archivo que contiene `process.env` (`grep -r process.env --exclude-dir=node_modules`)
- [x] 2.2 Crear `.env.example` con todas las variables documentadas y copiarlo a `.env`; verificar que `.env` no aparece en `git status`

## 3. Errores y middlewares

- [x] 3.1 Crear `errors/AppError.js` con `code`, `message`, `statusCode` y `details` opcional
- [x] 3.2 Crear `middlewares/errorHandler.js` (AppError → su status; JSON mal formado → 400 `INVALID_JSON`; resto → 500 `INTERNAL_ERROR` sin stack) y `middlewares/notFound.js` (404 `NOT_FOUND` con método y ruta); verificar con los escenarios de `manejo-errores`
- [x] 3.3 Crear `middlewares/validate.js` reutilizable para body, params y query con `details` `{ field, message }`, y `middlewares/logger.js`; verificar con un schema de prueba que un body inválido devuelve 400 `VALIDATION_ERROR`

## 4. Contenedor, servidor y estado

- [x] 4.1 Crear `container/container.js` con `buildContainer()` asíncrono que devuelva el router principal con `GET /health`
- [x] 4.2 Crear `index.js` que solo cree la app, aplique `logger` y `express.json()`, monte docs y el router del contenedor y cierre con `notFound` y `errorHandler`; verificar que `npm start` levanta en el puerto de `.env`
- [x] 4.3 Verificar los escenarios de `estado-servicio`: `GET /health` responde 200 con la persistencia configurada en ambos valores de `PERSISTENCE_TYPE`

## 5. Documentación

- [x] 5.1 Crear `docs/openapi.yaml` (OpenAPI 3.0) con info del proyecto, `components/schemas/Error` y `ErrorValidacion`, y el path `/health` referenciando esos schemas
- [x] 5.2 Montar Swagger UI en `/api-docs` y la especificación en `/api-docs.json`; verificar los escenarios de `documentacion-api` y que "Try it out" de `/health` funcione
- [x] 5.3 Crear `requests.http` con los pedidos de verificación de este change (health, ruta inexistente, JSON inválido)
- [x] 5.4 Actualizar `README.md` con descripción del dominio, instalación, variables de entorno y ruta `/api-docs`

## Workflow follow-up

- Commitear por grupo de tareas (1 a 5) con mensajes descriptivos.
- Ejecutar `/opsx:archive` cuando el change esté verificado, para pasar las specs a `openspec/specs/`.
