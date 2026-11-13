# Design

## Context

Ver proposal.md - Why. Estado actual: `index.js` crea la app, aplica middlewares, monta docs y el router del contenedor y llama a `listen`; `container/container.js` lee `PERSISTENCE_TYPE` desde config. No hay ningún test.

## Goals / Non-Goals

**Goals:**
- Poder construir la app completa en un test, sin puerto y sin `.env`.
- Que los tests HTTP ejerciten la misma app que corre en producción (mismos middlewares y mismo orden).
- Dejar un patrón claro para los tests de casos de uso que vienen.

**Non-Goals:**
- Medir un porcentaje mínimo de cobertura (el reporte queda disponible, sin umbral).
- Cambiar el comportamiento de ningún endpoint.

## Decisions

### D1. `createApp(options)` asíncrona en `app.js`
`createApp` arma middlewares, docs, el router de `buildContainer(options)`, `notFound` y `errorHandler`, y devuelve la app sin escuchar. Es `async` porque el contenedor lo es (D3 de base-proyecto). `index.js` queda en: `const app = await createApp(); app.listen(...)`, con el manejo de error que termina el proceso.
*Alternativa:* exportar `app` ya construida desde un módulo; descartada porque fija la configuración al importar y no deja pasar opciones por test.

### D2. Opciones con valores por defecto desde config
`buildContainer({ persistenceType = PERSISTENCE_TYPE } = {})` y `createApp(options)` las propaga. Así el escenario "health con sequelize" se prueba pasando la opción, sin tocar `process.env`. Cuando exista `daoFactory`, recibirá el mismo parámetro: los tests podrán correr los dos modos de persistencia con la misma suite.
*Alternativa:* `vi.stubEnv` + reimportar config; descartada por frágil (config se evalúa una sola vez al importar).

### D3. Vitest con entorno node y sin globals
`vitest.config.js` con `environment: "node"` e `include: ["tests/**/*.test.js"]`. Se importan `describe/it/expect` explícitamente para que cada test sea autoexplicativo en la defensa.
*Alternativa:* Jest; descartado porque con ES Modules necesita `--experimental-vm-modules`.

### D4. El escenario 500 se prueba sobre el `errorHandler` real
No existe un endpoint que falle a propósito y no se agregará uno a la API. El test monta una app mínima de Express con una ruta que lanza `new Error()` seguida del `errorHandler` del proyecto, y verifica 500 `INTERNAL_ERROR` sin stack. Además se silencia `console.error` en ese test con `vi.spyOn`.

### D5. TDD en un change de caracterización
Los tests de este change describen comportamiento que ya existe, así que pueden pasar en la primera corrida. Para cumplir el paso "rojo" de AGENTS.md §3, cada test se valida rompiendo temporalmente el código que cubre (por ejemplo, cambiar el 404 de `notFound` por 400), comprobando que falla por el motivo esperado y revirtiendo el cambio. Para `createApp` el rojo es real: los tests HTTP se escriben antes de crear `app.js`.

## Risks / Trade-offs

- [El contenedor real usará Sequelize en el futuro y los tests HTTP podrían tocar una base] → los tests HTTP siempre pasan `persistenceType: "memory"` salvo los que prueben explícitamente otro modo.
- [Swagger UI responde con redirecciones según la barra final] → el test pide `/api-docs/` con barra, como documenta la spec.
