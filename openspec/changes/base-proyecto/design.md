# Design

## Context

Repo vacío (solo README). Ver proposal.md para la motivación. La referencia es la cursada (`jueves_tp2a_ya`, ramas `clase_6` a `clase_10`), cuyo esqueleto se adapta al dominio y a las convenciones de la consigna.

## Goals / Non-Goals

**Goals:**
- Dejar armado el flujo `index.js → container → routers` para que los próximos changes solo agreguen piezas.
- Que el formato de error y la validación funcionen igual para cualquier entidad futura.
- Que Swagger esté publicado desde el primer día y cada change sume sus endpoints.

**Non-Goals:**
- `daoFactory` y conexión a base de datos: se crean cuando exista la primera entidad.
- Bus de eventos: llega con el change de eventos.

## Decisions

### D1. Express 5 en lugar de Express 4
Express 5 propaga solo los errores de handlers `async` al middleware de errores, sin `try/catch` ni `express-async-handler` en cada controlador. Es la versión usada en la cursada.
*Alternativa:* Express 4 + wrapper `asyncHandler`; descartada por agregar código repetido.

### D2. `node --env-file` en lugar de `dotenv`
Node 20.6+ lee `.env` nativamente; una dependencia menos. `config/config.js` es el único módulo que toca `process.env`, con valores por defecto y conversión de tipos.
*Alternativa:* `dotenv`; innecesaria con Node actual.

### D3. Composition Root asíncrono
`buildContainer()` es `async` y devuelve un `Router`. Así, cuando llegue Sequelize, el `sync()` de la base se hace dentro del contenedor sin cambiar `index.js`. Si el contenedor falla al construirse, `index.js` termina el proceso con un mensaje claro.

### D4. Swagger con archivo `docs/openapi.yaml` (no `swagger-jsdoc`)
Un único archivo con todos los paths y `components/schemas` es más fácil de mantener consistente, de revisar en un diff y de reutilizar con `$ref`. Se carga con la librería `yaml` y se sirve con `swagger-ui-express`; además se expone `GET /api-docs.json`.
*Alternativa:* `swagger-jsdoc` con comentarios en las rutas; descartada porque mezcla documentación con ruteo y dispersa los schemas.

### D5. Middleware `validate(schema, target)`
Un solo middleware para `body`, `params` y `query`, que traduce los issues de Zod a `AppError("VALIDATION_ERROR", ..., 400, details[])` con `{ field, message }`. Reemplaza `req.body`/`req.params`/`req.query` por los datos ya parseados (en Express 5 `req.query` es un getter, por eso se redefine con `Object.defineProperty`).

### D6. JSON mal formado
`express.json()` lanza un `SyntaxError` con `type === "entity.parse.failed"`. El `errorHandler` lo traduce a 400 `INVALID_JSON` en lugar de dejarlo caer como 500.

### D7. `/health` informa la persistencia
Devuelve el valor de `PERSISTENCE_TYPE` leído en `config`. Durante la defensa permite confirmar en un request que el cambio de persistencia surtió efecto. Se expone sin controlador ni caso de uso, porque no tiene lógica de negocio.

## Risks / Trade-offs

- [Fines de línea mezclados entre Windows y Linux ensucian los diffs] → `.gitattributes` con `* text=auto eol=lf`.
- [`openapi.yaml` puede quedar desactualizado respecto del código] → regla del proyecto: cada change que agrega un endpoint lo documenta en la misma tarea.
- [El `/health` sin capas podría verse como excepción a la arquitectura] → está documentado acá como decisión; no accede a datos.
