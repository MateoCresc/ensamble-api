# Spec Delta

## Purpose

Gestiona los encargos que los clientes le hacen al taller: qué se fabrica, para quién, con qué materiales y en qué estado está, controlando que el stock alcance al confirmar.

## ADDED Requirements

### Requirement: Alta de encargo
La API SHALL crear un encargo con `POST /encargos` enviando `clienteId` (obligatorio), `descripcion` (3 a 500 caracteres), `fechaEntregaEstimada` (opcional, `AAAA-MM-DD`) y `materiales` (opcional, lista de `{ materialId, cantidad }` con cantidad mayor a 0 y hasta 2 decimales). Responde 201 con el encargo en estado `presupuestado`, su `cliente` (`id`, `nombre`), sus materiales (`materialId`, `nombre`, `unidad`, `cantidad`) y el header `Location`.

#### Scenario: Encargo creado
- **GIVEN** existen el cliente 1 y el material 1 ("Tablón de pino", `m`)
- **WHEN** se envía `POST /encargos` con `{ "clienteId": 1, "descripcion": "Mesa de comedor", "materiales": [{ "materialId": 1, "cantidad": 4.5 }] }`
- **THEN** la respuesta es 201 con `estado` `presupuestado`, `cliente` `{ id: 1, nombre }`, `materiales` `[{ materialId: 1, nombre: "Tablón de pino", unidad: "m", cantidad: 4.5 }]` y `Location` `/encargos/<id>`

#### Scenario: Encargo sin materiales
- **WHEN** se crea un encargo sin el campo `materiales`
- **THEN** la respuesta es 201 con `materiales` como array vacío y `fechaEntregaEstimada` en `null` si no se envió

#### Scenario: Cliente inexistente
- **WHEN** se crea un encargo con `clienteId` 999 inexistente
- **THEN** la respuesta es 404 con `error.code` igual a `CLIENTE_NO_ENCONTRADO`

#### Scenario: Material inexistente
- **WHEN** la lista de materiales incluye un `materialId` que no existe
- **THEN** la respuesta es 404 con `error.code` igual a `MATERIAL_NO_ENCONTRADO` y `details` con los ids inexistentes

#### Scenario: Material repetido o cantidad inválida
- **WHEN** la lista repite un `materialId` o una cantidad es 0, negativa o tiene más de 2 decimales
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

### Requirement: Consulta de encargo por id
La API SHALL devolver un encargo con `GET /encargos/:id`, incluyendo su cliente y sus materiales. Si no existe responde 404 `ENCARGO_NO_ENCONTRADO`; un id inválido responde 400.

#### Scenario: Encargo existente
- **WHEN** se hace `GET /encargos/1` y existe
- **THEN** la respuesta es 200 con `estado`, `cliente` y `materiales`

#### Scenario: Encargo inexistente
- **WHEN** se hace `GET /encargos/999`
- **THEN** la respuesta es 404 con `error.code` igual a `ENCARGO_NO_ENCONTRADO`

### Requirement: Listado de encargos
La API SHALL listar encargos con `GET /encargos` (200, array ordenado por `id`), con filtros `clienteId` y `estado`, orden `sort` (`id` o `-id`) y paginación `page`/`limit` como en clientes. Valores inválidos responden 400.

#### Scenario: Encargos de un cliente
- **GIVEN** el cliente 1 tiene 2 encargos y el cliente 2 tiene 1
- **WHEN** se hace `GET /encargos?clienteId=1`
- **THEN** la respuesta tiene los 2 encargos del cliente 1

#### Scenario: Filtro por estado
- **WHEN** se hace `GET /encargos?estado=confirmado`
- **THEN** la respuesta incluye solo encargos confirmados

#### Scenario: Estado inexistente
- **WHEN** se hace `GET /encargos?estado=terminado`
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

### Requirement: Modificación de encargo presupuestado
La API SHALL modificar con `PUT /encargos/:id` los campos enviados (`descripcion`, `fechaEntregaEstimada`, `materiales`; la lista de materiales enviada reemplaza a la anterior) solo mientras el encargo está `presupuestado`. En otro estado responde 409 `ENCARGO_NO_EDITABLE`. Valida cliente y materiales igual que el alta.

#### Scenario: Reemplazo de materiales
- **GIVEN** el encargo 1 está presupuestado con el material 1
- **WHEN** se hace `PUT /encargos/1` con `{ "materiales": [{ "materialId": 2, "cantidad": 3 }] }`
- **THEN** la respuesta es 200 y el encargo tiene solo el material 2

#### Scenario: Encargo ya confirmado
- **GIVEN** el encargo 1 está confirmado
- **WHEN** se hace `PUT /encargos/1` con `{ "descripcion": "Otra cosa" }`
- **THEN** la respuesta es 409 con `error.code` igual a `ENCARGO_NO_EDITABLE`

### Requirement: Baja de encargo
La API SHALL eliminar con `DELETE /encargos/:id` un encargo `presupuestado` o `cancelado` (204). En otro estado responde 409 `ENCARGO_NO_ELIMINABLE`; si no existe, 404.

#### Scenario: Baja de presupuesto
- **WHEN** se elimina un encargo presupuestado
- **THEN** la respuesta es 204 y un `GET` posterior responde 404

#### Scenario: Baja de encargo confirmado
- **WHEN** se intenta eliminar un encargo confirmado
- **THEN** la respuesta es 409 con `error.code` igual a `ENCARGO_NO_ELIMINABLE`

### Requirement: Confirmación con descuento de stock
`PUT /encargos/:id/confirmar` SHALL pasar un encargo `presupuestado` a `confirmado` descontando la cantidad de cada material de su stock, todo en una operación atómica. Sin materiales responde 409 `ENCARGO_SIN_MATERIALES`; si falta stock de alguno responde 409 `STOCK_INSUFICIENTE` y no modifica ningún stock ni el estado.

#### Scenario: Confirmación exitosa
- **GIVEN** el encargo 1 pide 4.5 del material 1, que tiene stock 12.5
- **WHEN** se hace `PUT /encargos/1/confirmar`
- **THEN** la respuesta es 200 con `estado` `confirmado` y el material 1 queda con stock 8

#### Scenario: Stock insuficiente
- **GIVEN** el encargo 1 pide 2 del material 1 (stock 10) y 5 del material 2 (stock 3)
- **WHEN** se hace `PUT /encargos/1/confirmar`
- **THEN** la respuesta es 409 `STOCK_INSUFICIENTE` con `details` `[{ materialId: 2, nombre, requerido: 5, disponible: 3 }]`, el material 1 sigue con stock 10 y el encargo sigue `presupuestado`

#### Scenario: Encargo sin materiales
- **WHEN** se confirma un encargo sin materiales
- **THEN** la respuesta es 409 con `error.code` igual a `ENCARGO_SIN_MATERIALES`

### Requirement: Cancelación con reposición de stock
`PUT /encargos/:id/cancelar` SHALL pasar a `cancelado` un encargo `presupuestado` o `confirmado`. Si estaba confirmado, repone en la misma operación atómica el stock que se había descontado.

#### Scenario: Cancelar un confirmado
- **GIVEN** el encargo 1 confirmado descontó 4.5 del material 1, que quedó con stock 8
- **WHEN** se hace `PUT /encargos/1/cancelar`
- **THEN** la respuesta es 200 con `estado` `cancelado` y el material 1 vuelve a stock 12.5

#### Scenario: Cancelar un presupuesto
- **WHEN** se cancela un encargo presupuestado
- **THEN** la respuesta es 200 con `estado` `cancelado` y ningún stock cambia

### Requirement: Avance de producción
`PUT /encargos/:id/iniciar` SHALL pasar un encargo `confirmado` a `en_produccion` y `PUT /encargos/:id/entregar` uno `en_produccion` a `entregado`, sin tocar stock.

#### Scenario: Recorrido completo
- **GIVEN** un encargo confirmado
- **WHEN** se hace `iniciar` y luego `entregar`
- **THEN** cada respuesta es 200 y el estado final es `entregado`

### Requirement: Transiciones inválidas
Cualquier acción que no corresponda al estado actual (por ejemplo confirmar uno cancelado, iniciar uno presupuestado o cancelar uno entregado) SHALL responder 409 `TRANSICION_INVALIDA` con `details` `{ estadoActual, accion }`, sin modificar nada. Sobre un encargo inexistente responde 404.

#### Scenario: Confirmar dos veces
- **GIVEN** el encargo 1 está confirmado
- **WHEN** se hace `PUT /encargos/1/confirmar`
- **THEN** la respuesta es 409 `TRANSICION_INVALIDA` con `details.estadoActual` igual a `confirmado` y el stock no vuelve a descontarse

#### Scenario: Cancelar un entregado
- **WHEN** se cancela un encargo entregado
- **THEN** la respuesta es 409 `TRANSICION_INVALIDA`
