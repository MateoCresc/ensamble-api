# Tasks

## 1. Preparación

- [x] 1.1 Verificar que la rama es `feat/persistencia-materiales` creada desde `main` actualizado y archivar el change `clientes` (pendiente del PR #3); verificar `openspec validate --all --strict`. Commit: `openspec/` + ajustes de reglas en `AGENTS.md` y `openspec/config.yaml`

## 2. Materiales: dominio

- [x] 2.1 Escribir los tests unitarios de `usecases/materiales/` (alta con defaults, nombre duplicado sin distinguir mayúsculas/espacios, consulta 404, listado con filtros `nombre`/`unidad`/`bajoStock`, orden `-stock`, paginación, actualización parcial con nombre de otro → 409, baja y baja inexistente); verificar que fallan porque los módulos no existen
- [x] 2.2 Implementar `dao/materiales/materiales.memory.dao.js`, los casos de uso, `reglas.js` y `makeMaterialesUseCases`; verificar que los tests de 2.1 pasan y la suite completa sigue en verde. Commit: `dao/materiales/`, `usecases/materiales/`, `tests/unit/usecases/materiales/`

## 3. Materiales: HTTP y documentación

- [x] 3.1 Escribir `tests/http/materiales.http.test.js` con todos los escenarios de la spec `materiales` (incluidos 400 por unidad, stock negativo, más de 2 decimales y `bajoStock` inválido); verificar que fallan con 404 `NOT_FOUND`
- [x] 3.2 Crear `schemas/materiales.schema.js` (D4, D8), controlador y rutas, y montarlos en el contenedor; verificar que los tests de 3.1 pasan
- [x] 3.3 Documentar los cinco endpoints en `docs/openapi.yaml` (`Material`, `MaterialInput`, `MaterialUpdate`, sin ejemplos precargados en los filtros) y agregar pedidos a `requests.http`; verificar el test de documentación. Commit: `schemas/`, `controllers/`, `routes/`, `container/`, `tests/http/materiales.http.test.js`, `docs/openapi.yaml`, `requests.http`

## 4. Persistencia Sequelize

- [x] 4.1 Instalar `sequelize` y `sqlite3` (aprobados en la propuesta); agregar `DB_STORAGE` y `DB_LOGGING` a `config/config.js` y `.env.example` (D7); verificar que la app arranca igual en modo memoria
- [x] 4.2 Parametrizar `tests/http/clientes.http.test.js` y `tests/http/materiales.http.test.js` con `describe.each(["memory", "sequelize"])` y hacer que `buildTestApp` use `dbStorage: ":memory:"` (D6); el rojo lo dan los tests de contrato de 4.2b (la suite HTTP pasaría igual en modo `sequelize` mientras el contenedor ignore el modo)
- [x] 4.2b Escribir `tests/unit/dao/clientes.dao.test.js` y `materiales.dao.test.js` como tests de contrato con `describe.each` sobre los DAO creados por `createDaos` en ambos modos (forma plana, defaults, id ignorado, búsquedas sin distinguir mayúsculas, update/delete, números en stock); verificar que fallan porque `createDaos` no existe
- [x] 4.3 Crear `connection/sequelize.js` (`createSequelize`) y `dao/models/index.js` (`defineModels` con `ClienteModel` y `MaterialModel`, índices únicos) (D1, D5)
- [x] 4.4 Crear `ClientesSequelizeDao` y `MaterialesSequelizeDao` (D3, D4, D5) y `dao/daoFactory.js` (D2); hacer que `createApp` → `buildContainer` → `createDaos` propaguen `{ persistenceType, dbStorage }`; verificar que toda la suite pasa en ambos modos
- [x] 4.5 Escribir un test de la regla de unicidad respaldada por la base (escenario "Unicidad garantizada también por la base") llamando al DAO Sequelize directamente con dos altas del mismo email; verificar 409. Commit: `package*.json`, `config/`, `.env.example`, `connection/`, `dao/models/`, `dao/daoFactory.js`, `dao/*/*.sequelize.dao.js`, `app.js`, `container/`, `tests/`

## 5. Conservación de datos, verificación y README

- [x] 5.1 Escribir `tests/http/persistencia.http.test.js`: "reinicio con base de datos" (dos apps sobre el mismo archivo temporal) y "reinicio en memoria"; verificar en rojo con una implementación que use `:memory:` siempre y en verde con la real
- [x] 5.2 Levantar el servidor en cada modo y recorrer los endpoints de clientes y materiales desde Swagger UI; verificar el escenario "valor inválido" arrancando con `PERSISTENCE_TYPE=mongo`
- [x] 5.3 Actualizar `README.md`: entidad Material, cómo cambiar de persistencia, `DB_STORAGE`/`DB_LOGGING` y qué hacer si cambia el esquema. Commit: `tests/http/persistencia.http.test.js`, `README.md`, `openspec/changes/persistencia-materiales/tasks.md`

## Workflow follow-up

- Archivar el change como último commit del PR y redactar la descripción con la plantilla.
- Mergear sin squash.
