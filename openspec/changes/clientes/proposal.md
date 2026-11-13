# Proposal

## Why

La API todavía no tiene ninguna entidad del dominio. Siguiendo el camino elegido (una entidad completa primero y después replicar el patrón, como libros en la cursada), `clientes` es la primera: no depende de ninguna otra entidad y fija las convenciones de schemas, DAO, casos de uso, controlador, rutas, Swagger y tests que van a copiar materiales y encargos.

Cubre de la consigna: 2.2 (CRUD completo y regla de negocio en un caso de uso: email único), 2.3 (validación Zod de body, params y query), 2.5 (casos de uso con factory inyectados desde el contenedor) y 2.7 (endpoints documentados). Suma al opcional de filtros, ordenamiento y paginación.

## What Changes

- Recurso `/clientes` con listar, obtener por id, crear, actualizar (PUT parcial, como la cursada) y eliminar.
- Regla de negocio: el email de un cliente no puede repetirse, ni al crear ni al actualizar (409 `EMAIL_DUPLICADO`).
- Listado con filtros por `nombre` y `email`, ordenamiento con `sort` y paginación con `page` y `limit`.
- DAO de clientes en memoria, ensamblado desde el contenedor.
- Documentación de los cinco endpoints en `docs/openapi.yaml` y pedidos en `requests.http`.
- Tests unitarios de los casos de uso y tests HTTP de cada endpoint (TDD).

## Capabilities

### New Capabilities
- `clientes`: alta, consulta, modificación y baja de clientes del taller, con email único y listado filtrable.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- Código nuevo: `schemas/clientes.schema.js`, `dao/clientes/clientes.memory.dao.js`, `usecases/clientes/*`, `controllers/clientes.controller.js`, `routes/clientes.routes.js`, tests en `tests/unit/usecases/clientes/` y `tests/http/clientes.http.test.js`.
- Cambios: `container/container.js`, `docs/openapi.yaml`, `requests.http`, `README.md`.
- Sin dependencias nuevas.
- **Prerrequisito**: la infraestructura de `infraestructura-tests` (`app.js`, Vitest, supertest) debe estar integrada en `main`.
- Fuera de alcance: DAO Sequelize y `daoFactory` (change `persistencia-sequelize`); la regla "no se puede eliminar un cliente con encargos activos" (llega con `encargos`, como requisito MODIFIED de esta capacidad).
