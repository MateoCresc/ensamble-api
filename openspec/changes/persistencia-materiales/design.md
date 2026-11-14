# Design

## Context

Ver proposal.md - Why. Hoy el contenedor crea `new ClientesMemoryDao()` directamente (design D6 de `clientes`) y no hay base de datos. Referencia: `clase_9` y `clase_10` de la cursada (`connection/sequelize.js`, `dao/models/index.js`, `BooksSequelizeDao`, `daoFactory`). Materiales replica las decisiones de `clientes` (DAO como clase, 404 en el caso de uso, filtros en el caso de uso, controlador `make…`, `sort` cerrado).

## Goals / Non-Goals

**Goals:**
- Que cambiar `PERSISTENCE_TYPE` no toque rutas, controladores ni casos de uso.
- Probar la equivalencia entre modos con la **misma** suite HTTP, no con tests escritos dos veces.
- Que cada test en modo `sequelize` tenga su propia base, sin estado compartido.

**Non-Goals:**
- Migraciones, datos semilla y otras bases (PostgreSQL, MySQL).
- Mover filtros y paginación a SQL (sigue D2 de `clientes`).

## Decisions

### D1. Conexión y modelos por instancia (no singleton)
`connection/sequelize.js` exporta `createSequelize({ storage, logging })` y `dao/models/index.js` exporta `defineModels(sequelize)`, que define `ClienteModel` y `MaterialModel` (y, en el futuro, las asociaciones centralizadas, como pide la consigna). Cada armado del contenedor crea su propia conexión.
Con `storage: ":memory:"` cada test obtiene una base nueva y vacía, y la suite HTTP se puede correr en ambos modos sin limpiar tablas.
*Alternativa:* el singleton que se importa de la cursada; descartado porque obliga a compartir una base entre tests (o a `sync({ force: true })` en cada uno) y acopla los modelos al momento de importar.

### D2. Factory de DAOs asíncrona
`dao/daoFactory.js` exporta `createDaos({ persistenceType, dbStorage, dbLogging })`:
- `memory` → `{ clientesDao: new ClientesMemoryDao(), materialesDao: new MaterialesMemoryDao() }`.
- `sequelize` → crea la conexión, define los modelos, ejecuta `sequelize.sync()` y devuelve los DAO Sequelize construidos con sus modelos.
El contenedor solo hace `const daos = await createDaos(opciones)`. `createApp` y `buildContainer` reciben `{ persistenceType, dbStorage }` con defaults de `config`; `buildTestApp` usa `dbStorage: ":memory:"`.
`sync()` sin `alter` ni `force`: crea las tablas que faltan y no toca datos (con SQLite, `alter` recrea tablas y es frágil). Los cambios de esquema durante el TP se resuelven borrando el archivo de desarrollo.

### D3. DAO Sequelize con la misma interfaz
`ClientesSequelizeDao` y `MaterialesSequelizeDao` reciben su modelo por constructor y exponen los mismos métodos que los de memoria (`getAll`, `getById`, `getByEmail`/`getByNombre`, `save`, `update`, `delete`):
- Columnas explícitas (`attributes`) y `get({ plain: true })`: nunca devuelven instancias del ORM.
- `getAll` ordena por `id` ascendente, como el DAO en memoria.
- La búsqueda por email/nombre es sin distinguir mayúsculas con `lower(columna) = lower(valor)`.
- `save` y `update` ignoran `id` y solo escriben columnas de la entidad.
- Índice único en `clientes.email` y en `materiales.nombreNormalizado` (ver D5). Si la base lo rechaza (dos altas simultáneas), el DAO traduce `UniqueConstraintError` a `AppError` 409 con el mismo código que el caso de uso, como hace `LoansSequelizeDao` en `clase_13`.

### D4. Cantidades con hasta 2 decimales
`stock` y `stockMinimo` se validan en el schema como números `>= 0` con a lo sumo 2 decimales (`Math.round(v * 100) / 100 === v`, tolerando el error de coma flotante). Se guardan como `DECIMAL(10, 2)`; el DAO Sequelize convierte a `Number` al leer (SQLite puede devolverlos como texto según el driver), así ambos modos devuelven números. Los cálculos de stock de `encargos` redondearán a 2 decimales.

### D5. Nombre de material normalizado
El schema aplica `trim` al nombre y se conserva tal como lo escribió el usuario. La unicidad compara `nombre.trim().toLowerCase()`. En SQLite se agrega la columna `nombreNormalizado` con índice único, que el DAO completa al guardar y actualizar y que **no** se devuelve en las respuestas. `lower()` de SQLite no pasa a minúsculas letras acentuadas: por eso se normaliza en JavaScript y no en SQL.
Con email no hace falta: el schema ya lo guarda en minúsculas.

### D6. Equivalencia probada con la misma suite
Los tests HTTP de clientes y materiales se envuelven en `describe.each(["memory", "sequelize"])` y usan `buildTestApp({ persistenceType })`. Un test aparte (`tests/http/persistencia.http.test.js`) arma dos apps sobre el mismo archivo temporal para verificar que los datos sobreviven al "reinicio". Los tests unitarios de casos de uso siguen con DAO en memoria (son reglas, no infraestructura).

### D7. Configuración
`config/config.js` suma `DB_STORAGE` (por defecto `./ensamble.sqlite`, ignorado por `*.sqlite` en `.gitignore`) y `DB_LOGGING` (`true`/`false`, por defecto `false`). Ambas en `.env.example` con comentario.

### D8. Filtro `bajoStock`
Llega como `"true"`/`"false"` en la query y el schema lo transforma a booleano (como `activos` en `loanSchema` de la cursada). Se resuelve en el caso de uso junto con los demás filtros.

## Risks / Trade-offs

- [`sqlite3` es un módulo nativo] → tiene binarios precompilados para Windows, Linux y macOS; el CI usa `npm ci` en Ubuntu.
- [Cada test en modo `sequelize` crea una base] → con `:memory:` cuesta pocos milisegundos; la suite sigue por debajo de los 5 segundos.
- [Duplicar la suite HTTP duplica su tiempo] → aceptable; es la prueba directa del criterio de 2 puntos.
- [`sync()` no aplica cambios de esquema sobre una base existente] → documentado en el README: borrar `ensamble.sqlite` en desarrollo.
