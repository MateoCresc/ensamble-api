# Design

## Context

Ver proposal.md - Why. Se toma como modelo la entidad `users` de la rama `clase_9` del repo de la cursada (schemas con `fields` reutilizables, DAO en memoria con campos privados, un archivo por caso de uso, factory `makeUserUseCases`), adaptada a las convenciones de AGENTS.md §5. Requisitos de comportamiento en `specs/clientes/spec.md`.

## Goals / Non-Goals

**Goals:**
- Dejar el patrón completo de una entidad que materiales y encargos van a replicar.
- Que la interfaz del DAO sirva igual para el futuro adaptador Sequelize.
- Que cada caso de uso se pueda testear con un DAO en memoria nuevo, sin HTTP.

**Non-Goals:**
- `daoFactory` y persistencia real (change `persistencia-sequelize`).
- Metadatos de paginación (total, páginas): la respuesta sigue siendo un array, como en la cursada.

## Decisions

### D1. Interfaz del DAO
`ClientesMemoryDao` es una clase con campos privados (`#clientes`, `#nextId`), igual que en la cursada, con los métodos `getAll()`, `getById(id)`, `getByEmail(email)`, `save(data)`, `update(id, changes)` y `delete(id)`. Todos son `async`, devuelven objetos planos (copias, no referencias internas) y `null`/`false` cuando no encuentran. `save` y `update` ignoran cualquier `id` recibido. `getByEmail` compara sin distinguir mayúsculas.
El archivo exporta la clase; **no** exporta una instancia única, para que cada test cree la suya y el contenedor decida cuántas hay.
*Alternativa:* singleton exportado como en la cursada; descartado porque comparte estado entre tests.

### D2. Filtros, orden y paginación en el caso de uso
`listarClientes(filtros)` pide `dao.getAll()` y aplica filtro, orden y paginación en memoria, como `getBooks` de la cursada. Así el DAO tiene una interfaz mínima e idéntica en ambos adaptadores, y la regla de "ambos modos responden igual" se cumple sin duplicar lógica en el DAO Sequelize.
*Alternativa:* pasar los filtros al DAO (`WHERE`, `LIMIT`); más eficiente con muchos datos, pero obliga a implementar y mantener la misma lógica dos veces. Se puede migrar después sin cambiar la spec.

### D3. El 404 se lanza en el caso de uso
`obtenerCliente`, `actualizarCliente` y `eliminarCliente` lanzan `AppError("CLIENTE_NO_ENCONTRADO", ..., 404)` cuando el DAO devuelve `null`/`false`. El controlador queda solo con la traducción HTTP.
Es una diferencia con la cursada (allí el controlador lanza el 404): la existencia del recurso es una condición del dominio y así queda cubierta por los tests unitarios. Además, `encargos` va a necesitar "el cliente existe" dentro de su propio caso de uso.

### D4. Validación de entrada (Zod)
- `fields` reutilizables: `nombre` (string, trim, min 2, max 100), `email` (`z.email()` + `toLowerCase()`), `telefono` (string, trim, 6 a 20 caracteres de dígitos, espacios, `+` o `-`; nullable).
- `crearClienteSchema`: `nombre` y `email` obligatorios, `telefono` opcional con default `null`.
- `actualizarClienteSchema`: los tres opcionales + `refine` que exige al menos un campo (body `{}` → 400).
- `clienteIdParamSchema`: `id` con `z.coerce.number().int().positive()`.
- `listarClientesQuerySchema`: `nombre`, `email`, `sort` como `z.enum(["id","-id","nombre","-nombre","email","-email"])`, `page` y `limit` con `coerce` (limit máximo 100).
La normalización del email a minúsculas en el schema garantiza que se guarde así; la comparación sin mayúsculas en el DAO cubre datos que no pasaron por el schema.

### D5. Controlador como factory
`makeClientesController(useCases)` devuelve `{ listar, obtener, crear, actualizar, eliminar }`, siguiendo el patrón `make…` que ya usa el proyecto (`makeHealthRouter`, `makeDocsRouter`). Es equivalente a la clase de la cursada. `crear` responde 201 con `Location`; `eliminar`, 204.

### D6. Ensamblado provisorio en el contenedor
Hasta que exista `daoFactory`, `buildContainer` crea `new ClientesMemoryDao()` directamente, arma `makeClientesUseCases({ clientesDao })` y monta `makeClientesRouter(controller)` en `/clientes`. `persistenceType` se sigue informando en `/health` sin cambios.
`makeClientesUseCases` recibe un objeto de dependencias (`{ clientesDao }`) en lugar de un DAO suelto, como `makeLoanUseCases` de `clase_13`: así sumar el bus de eventos u otro DAO no cambia la firma.

## Risks / Trade-offs

- [Filtrar en memoria escala mal con muchos clientes] → aceptable para el TP; D2 deja documentada la migración.
- [El test HTTP con `persistenceType: "sequelize"` de `/health` seguiría usando memoria para clientes] → correcto mientras no exista la factory; `persistencia-sequelize` lo resuelve.
- [Cada test HTTP crea una app nueva y por lo tanto un DAO vacío] → es lo buscado (aislamiento); los datos de cada escenario se crean en el propio test con `POST`.
