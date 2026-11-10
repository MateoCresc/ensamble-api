# Proposal

## Why

AGENTS.md fija TDD como forma de trabajo, pero el proyecto todavía no tiene runner de tests y `index.js` arma la app y escucha el puerto en el mismo archivo, lo que impide probar endpoints sin levantar un servidor. Además, los escenarios del change `base-proyecto` (health, 404, JSON inválido, 500, Swagger) se verificaron solo a mano. Este change deja la infraestructura lista para que todos los changes de entidades arranquen con el test en rojo.

Cubre el requisito opcional de la consigna "tests automatizados de los casos de uso" (punto 3) y sostiene la calidad de código (punto 6).

## What Changes

- Separar la construcción de la app en `app.js` (`createApp(options)`) y dejar `index.js` solo con `createApp()` + `listen`, como pide la consigna 2.1.
- Permitir que `createApp` y `buildContainer` reciban opciones (por ahora, el tipo de persistencia) con valores por defecto tomados de `config`, para poder testear sin variables de entorno.
- Agregar Vitest y supertest como dependencias de desarrollo, con scripts `test`, `test:watch` y `test:coverage`.
- Crear la estructura `tests/unit`, `tests/http` y `tests/helpers`.
- Escribir tests que cubran todos los escenarios de las specs de `base-proyecto`: `manejo-errores`, `estado-servicio` y `documentacion-api`, más el middleware `validate`.
- Actualizar el README con cómo correr los tests.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
<!-- Ninguna: el comportamiento observable de la API no cambia. El change declara skip_specs. -->

Los tests verifican los requisitos ya definidos en `base-proyecto`; no se agregan ni modifican requisitos.

## Impact

- Archivos: nuevo `app.js` y `vitest.config.js`; cambios en `index.js`, `container/container.js`, `package.json` y `README.md`; nueva carpeta `tests/`.
- **Dependencias nuevas (desarrollo)**: `vitest`, `@vitest/coverage-v8` y `supertest`. Requieren aprobación del autor.
- Fuera de alcance: tests de entidades (llegan con cada change de entidad), tests de contrato de DAOs, CI en GitHub Actions y linters.
