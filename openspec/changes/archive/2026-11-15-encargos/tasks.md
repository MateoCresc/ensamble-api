# Tasks

## 1. Preparación

- [x] 1.1 Verificar que la rama es `feat/encargos` creada desde `main` con `persistencia-materiales` mergeado y archivado, y que `npm test` está en verde (sin commit)

## 2. Encargos: CRUD en memoria

- [x] 2.1 Escribir tests unitarios de `crearEncargo`, `obtenerEncargo`, `listarEncargos`, `actualizarEncargo` y `eliminarEncargo` con DAOs en memoria (escenarios de alta, cliente/material inexistente, filtros, reemplazo de materiales, no editable, no eliminable, 404); verificar que fallan
- [x] 2.2 Implementar `dao/encargos/encargos.memory.dao.js` (D2), `usecases/encargos/` con `estados.js` (D3, D7) y `makeEncargosUseCases`; verificar que los tests pasan. Commit: `dao/encargos/encargos.memory.dao.js`, `usecases/encargos/`, `tests/unit/usecases/encargos/`

## 3. Ciclo de vida y stock

- [x] 3.1 Escribir tests unitarios de `confirmarEncargo` (exitosa con redondeo, stock insuficiente sin cambios, sin materiales), `cancelarEncargo` (con y sin reposición), `iniciarEncargo`, `entregarEncargo` y transiciones inválidas; verificar que fallan
- [x] 3.2 Implementar los casos de uso (D4 paso 1 y 3, D5) y `cambiarEstado` con movimientos atómico en el DAO en memoria usando `materialesDao.ajustarStock` (D4 paso 2); verificar que pasan. Commit: `usecases/encargos/`, `dao/encargos/`, `dao/materiales/materiales.memory.dao.js`, `tests/unit/usecases/encargos/`

## 4. Eventos y notificaciones

- [x] 4.1 Escribir tests: `confirmarEncargo` emite `encargo.confirmado` y `material.stockBajo` solo para materiales en o bajo el mínimo (bus real y listener espía); el listener captura la falla del notificador; `createFileNotifier` agrega una línea con asunto y mensaje en un archivo temporal; `crearNotificador` devuelve el tipo pedido y rechaza uno desconocido; verificar que fallan
- [x] 4.2 Implementar `events/`, `listeners/registrarListeners.js`, `notifications/` y la emisión en `confirmarEncargo` (D6); sumar `NOTIFIER_ENCARGOS`, `NOTIFIER_STOCK`, `NOTIFICATIONS_FILE` a config y `.env.example`; verificar que pasan. Commit: `events/`, `listeners/`, `notifications/`, `config/`, `.env.example`, `usecases/encargos/confirmarEncargo.js`, `tests/unit/`

## 5. Reglas cruzadas en clientes y materiales

- [x] 5.1 Escribir tests unitarios: baja de cliente con encargos → 409 `CLIENTE_CON_ENCARGOS`; baja de material en uso → 409 `MATERIAL_EN_USO`; ambos siguen existiendo; verificar que fallan
- [x] 5.2 Pasar `encargosDao` a las factories de clientes y materiales e implementar `existePorCliente`/`existePorMaterial` en el DAO en memoria (D8); verificar que pasan y que los tests previos de clientes y materiales siguen en verde. Commit: `usecases/clientes/`, `usecases/materiales/`, `dao/encargos/`, `tests/unit/usecases/`

## 6. Persistencia Sequelize de encargos

- [x] 6.1 Escribir `tests/unit/dao/encargos.dao.test.js` como test de contrato con `describe.each` sobre ambos DAO: alta con materiales, forma de respuesta, `confirmar` atómico (un material sin stock deja todo intacto), `cancelar` con reposición, `existePorCliente`/`existePorMaterial`; verificar que la mitad Sequelize falla
- [x] 6.2 Agregar `EncargoModel`, `EncargoMaterialModel` y las asociaciones con `RESTRICT` en `dao/models/index.js` (D1); implementar `EncargosSequelizeDao` con transacciones (D4, D5) y sumarlo a `createDaos`; verificar que el contrato pasa en ambos modos. Commit: `dao/models/`, `dao/encargos/encargos.sequelize.dao.js`, `dao/daoFactory.js`, `tests/unit/dao/`

## 7. HTTP, eventos en el contenedor y documentación

- [x] 7.1 Escribir `tests/http/encargos.http.test.js` en ambos modos con todos los escenarios de `encargos` (incluidos stock insuficiente, recorrido completo y transiciones inválidas) y los de baja de cliente/material con encargos; un test con notificador falso que falla confirma igual (escenario "canal caído"); verificar que fallan
- [x] 7.2 Crear `schemas/encargos.schema.js` (D9), controlador y rutas (D10); en el contenedor crear el bus, registrar listeners con los notificadores de la factory (o los de la opción `notificadores`) y montar `/encargos`; verificar que toda la suite pasa en ambos modos
- [x] 7.3 Documentar los nueve endpoints en `docs/openapi.yaml` (`Encargo`, `EncargoInput`, `EncargoUpdate`, `EncargoMaterial`, errores 404/409 con ejemplos; sumar 409 a `DELETE` de clientes y materiales) y agregar a `requests.http` un recorrido completo; verificar el test de documentación. Commit: `schemas/`, `controllers/`, `routes/`, `container/`, `tests/http/`, `docs/openapi.yaml`, `requests.http`

## 8. Verificación integral y README

- [x] 8.1 Levantar el servidor en ambos modos y recorrer desde Swagger UI: alta de encargo, confirmación con aviso en consola, stock bajo en el archivo de notificaciones, stock insuficiente, cancelación con reposición y bajas bloqueadas
- [x] 8.2 Actualizar `README.md`: entidad Encargo, diagrama de relaciones (Cliente 1—N Encargo N—N Material), estados, eventos y qué hace cada listener, variables de notificación. Commit: `README.md`, `openspec/changes/encargos/tasks.md`

## Workflow follow-up

- Archivar el change como último commit del PR y redactar la descripción con la plantilla.
- Mergear sin squash.
