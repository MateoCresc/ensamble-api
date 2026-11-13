# Tasks

## 1. Prerrequisitos

- [ ] 1.1 Verificar que `main` incluye la infraestructura de `infraestructura-tests` (`app.js`, `tests/`, scripts de Vitest) y que `npm test` corre en verde antes de empezar

## 2. DAO en memoria y alta / consulta (dominio)

- [ ] 2.1 Escribir `tests/unit/usecases/clientes/crearCliente.test.js` con "cliente creado" (id entero asignado, `telefono` null), "id enviado por el cliente" (se ignora) y "alta con email repetido" (409 `EMAIL_DUPLICADO`, sin distinguir mayúsculas); verificar que fallan porque los módulos no existen
- [ ] 2.2 Escribir `tests/unit/usecases/clientes/obtenerCliente.test.js` con "cliente existente" y "cliente inexistente" (404 `CLIENTE_NO_ENCONTRADO`, D3); verificar que fallan
- [ ] 2.3 Crear `dao/clientes/clientes.memory.dao.js` (D1), `usecases/clientes/crearCliente.js`, `obtenerCliente.js` y `makeClientesUseCases.js` (D6); verificar que los tests de 2.1 y 2.2 pasan y que la suite completa sigue en verde
- [ ] 2.4 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## 3. Listado, modificación y baja (dominio)

- [ ] 3.1 Escribir `tests/unit/usecases/clientes/listarClientes.test.js` con "listado completo" (orden por id), "sin clientes", "filtro por nombre parcial", "filtro por email", "orden descendente por nombre" y "segunda página" (paginación después de filtrar y ordenar); verificar que fallan
- [ ] 3.2 Escribir `actualizarCliente.test.js` ("actualización parcial", "actualización con email de otro cliente", "actualización conservando el propio email", "actualizar inexistente") y `eliminarCliente.test.js` ("cliente eliminado", "eliminar inexistente"); verificar que fallan
- [ ] 3.3 Implementar `listarClientes.js` (D2), `actualizarCliente.js` y `eliminarCliente.js` y sumarlos a `makeClientesUseCases`; verificar que los tests de 3.1 y 3.2 pasan
- [ ] 3.4 Refactorizar con la suite en verde (por ejemplo, extraer la verificación de email duplicado compartida entre crear y actualizar); verificar que `npm test` sigue en verde
- [ ] 3.5 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## 4. Capa HTTP: lectura

- [ ] 4.1 Escribir en `tests/http/clientes.http.test.js` los escenarios HTTP de lectura: `GET /clientes` (listado, vacío, filtros, `sort=-nombre`, `sort=telefono` → 400, `page=2&limit=2`, `limit=500` → 400) y `GET /clientes/:id` (existente, inexistente → 404, `abc` → 400); verificar que fallan con 404 `NOT_FOUND` porque la ruta no existe
- [ ] 4.2 Crear `schemas/clientes.schema.js` (D4), `controllers/clientes.controller.js` con `listar` y `obtener` (D5) y `routes/clientes.routes.js` con validación de params y query; montarlo en `container/container.js` (D6); verificar que los tests de 4.1 pasan
- [ ] 4.3 Documentar `GET /clientes` y `GET /clientes/{id}` en `docs/openapi.yaml` (parámetros con ejemplos, `components/schemas/Cliente`, respuestas 200/400/404 con `$ref`) y agregar los pedidos a `requests.http`; verificar que el test de documentación de `infraestructura-tests` sigue en verde
- [ ] 4.4 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## 5. Capa HTTP: escritura

- [ ] 5.1 Agregar a `tests/http/clientes.http.test.js` los escenarios de escritura: `POST` (201 + `Location`, datos inválidos → 400 con un detalle por campo, email repetido → 409), `PUT` (parcial → 200, `{}` → 400, inexistente → 404, email de otro → 409) y `DELETE` (204 y luego `GET` → 404, inexistente → 404); verificar que fallan
- [ ] 5.2 Completar el controlador con `crear`, `actualizar` y `eliminar` y las rutas con su validación de body y params; verificar que los tests de 5.1 pasan
- [ ] 5.3 Documentar `POST`, `PUT` y `DELETE` en `docs/openapi.yaml` (`ClienteInput`, `ClienteUpdate`, ejemplos, respuestas 201/204/400/404/409 con `$ref`) y agregar los pedidos a `requests.http`; verificar que la suite sigue en verde
- [ ] 5.4 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## 6. Verificación integral y README

- [ ] 6.1 Probar los cinco endpoints desde Swagger UI ("Try it out") con el servidor en marcha, recorriendo un alta, un listado filtrado, una modificación, un 409 y una baja; dejar registro en el resumen
- [ ] 6.2 Actualizar `README.md` con la entidad Cliente (campos y regla de email único) y los parámetros de listado; verificar que no duplica el listado de endpoints de Swagger
- [ ] 6.3 Detenerse, mostrar resumen con `npm test` en verde y proponer mensaje de commit (sin commitear)

## Workflow follow-up

- Trabajar el change en una rama `feat/clientes` y abrir un PR a `main` recién cuando esté completo.
- Archivar con `/opsx:archive` cuando el autor lo apruebe.
