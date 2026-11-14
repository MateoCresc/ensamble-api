# Proposal

## Why

Faltan los dos criterios de mayor peso que todavía no están cubiertos: persistencia intercambiable (2 puntos) y la segunda entidad con CRUD completo. Se resuelven juntos, como en la `clase_9` de la cursada (Sequelize como segundo adaptador + una entidad nueva con ambos DAOs): primero Materiales en memoria copiando el patrón de Clientes, y después SQLite/Sequelize para las dos entidades, verificando con la misma suite HTTP que ambos modos responden igual.

Cubre de la consigna: 2.2 (segunda entidad con CRUD), 2.4 (persistencia intercambiable, factory de DAOs, objetos planos, mismas respuestas), 2.5 (el contenedor resuelve los DAOs con la factory), 2.7 (endpoints de materiales documentados). Suma a los opcionales de filtros/paginación.

## What Changes

- Recurso `/materiales` con listar, obtener, crear, actualizar (PUT parcial) y eliminar; nombre único (409 `MATERIAL_DUPLICADO`), unidad de medida, stock y stock mínimo con hasta 2 decimales.
- Listado de materiales con filtros `nombre`, `unidad` y `bajoStock`, orden con `sort` y paginación con `page`/`limit`.
- Persistencia real con Sequelize + SQLite, elegida con `PERSISTENCE_TYPE=sequelize`, mediante una factory de DAOs que usa el contenedor.
- DAO Sequelize de Clientes y de Materiales con la misma interfaz que los de memoria.
- Variables nuevas: `DB_STORAGE` (archivo SQLite) y `DB_LOGGING`.
- Los tests HTTP de clientes y materiales corren en ambos modos de persistencia.

## Capabilities

### New Capabilities
- `materiales`: alta, consulta, modificación y baja de los materiales del taller, con nombre único y control de stock.
- `persistencia`: selección del almacenamiento por configuración, equivalencia de respuestas entre modos y conservación de datos entre reinicios.

### Modified Capabilities
<!-- Ninguna: clientes no cambia de comportamiento; solo gana un segundo adaptador. -->

## Impact

- Código nuevo: `connection/`, `dao/models/`, `dao/daoFactory.js`, `dao/materiales/`, `dao/clientes/clientes.sequelize.dao.js`, `usecases/materiales/`, `schemas/materiales.schema.js`, `controllers/materiales.controller.js`, `routes/materiales.routes.js` y sus tests.
- Cambios: `config/config.js`, `.env.example`, `container/container.js`, `app.js` (propaga opciones), `tests/helpers/buildTestApp.js`, `tests/http/clientes.http.test.js`, `docs/openapi.yaml`, `requests.http`, `README.md`.
- **Dependencias nuevas (producción)**: `sequelize` y `sqlite3` (las mismas de la cursada). Requieren aprobación del autor.
- Fuera de alcance: encargos y su relación con materiales, la regla "no se puede eliminar un material usado en encargos" (llega con `encargos`), eventos de stock bajo, migraciones y datos semilla.
