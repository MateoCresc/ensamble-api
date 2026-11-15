# materiales Specification

## Purpose
Gestiona los materiales del taller (maderas, metales, insumos) con su unidad de medida y su stock, que luego consumen los encargos.

## Requirements

### Requirement: Alta de material
La API SHALL crear un material con `POST /materiales` enviando `nombre` (obligatorio, 2 a 100 caracteres), `unidad` (obligatoria: `unidad`, `m`, `m2`, `kg` o `l`), `stock` y `stockMinimo` (opcionales, números mayores o iguales a 0, hasta 2 decimales, por defecto 0). Responde 201 con el material, un `id` entero propio y el header `Location`.

#### Scenario: Material creado
- **WHEN** el cliente envía `POST /materiales` con `{ "nombre": "Tablón de pino", "unidad": "m", "stock": 12.5, "stockMinimo": 3 }`
- **THEN** la respuesta es 201 con un `id` entero, los datos enviados y el header `Location` igual a `/materiales/<id>`

#### Scenario: Valores por defecto
- **WHEN** se crea un material enviando solo `nombre` y `unidad`
- **THEN** la respuesta es 201 con `stock` y `stockMinimo` en 0

#### Scenario: Datos inválidos
- **WHEN** se envía una `unidad` fuera de la lista, un `stock` negativo o con más de 2 decimales
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR` y un detalle por cada campo inválido

### Requirement: Nombre único de material
El nombre de un material SHALL ser único sin distinguir mayúsculas ni espacios en los extremos. Crear o actualizar un material con el nombre de otro responde 409 con código `MATERIAL_DUPLICADO`.

#### Scenario: Alta con nombre repetido
- **GIVEN** existe el material "Tablón de pino"
- **WHEN** se crea otro con nombre " TABLÓN DE PINO "
- **THEN** la respuesta es 409 con `error.code` igual a `MATERIAL_DUPLICADO`

#### Scenario: Actualización con el nombre de otro material
- **GIVEN** existen los materiales 1 ("Tablón de pino") y 2 ("Caño de hierro")
- **WHEN** se actualiza el material 2 con nombre "tablón de pino"
- **THEN** la respuesta es 409 con `error.code` igual a `MATERIAL_DUPLICADO`

### Requirement: Consulta de material por id
La API SHALL devolver un material con `GET /materiales/:id`. Si no existe responde 404 `MATERIAL_NO_ENCONTRADO`; si el id no es un entero positivo responde 400 `VALIDATION_ERROR`.

#### Scenario: Material existente
- **WHEN** el cliente hace `GET /materiales/1` y el material existe
- **THEN** la respuesta es 200 con sus datos

#### Scenario: Material inexistente
- **WHEN** el cliente hace `GET /materiales/999`
- **THEN** la respuesta es 404 con `error.code` igual a `MATERIAL_NO_ENCONTRADO`

### Requirement: Listado de materiales
La API SHALL listar los materiales con `GET /materiales` (200 con un array, ordenado por `id` sin parámetros) y aceptar los filtros `nombre` (parcial, sin distinguir mayúsculas), `unidad` (exacta) y `bajoStock` (`true`: stock menor o igual al stock mínimo; `false`: el resto).

#### Scenario: Filtro por bajo stock
- **GIVEN** existen "Tablón de pino" (stock 2, mínimo 5) y "Caño de hierro" (stock 10, mínimo 2)
- **WHEN** el cliente hace `GET /materiales?bajoStock=true`
- **THEN** la respuesta incluye solo "Tablón de pino"

#### Scenario: Filtro por unidad
- **WHEN** el cliente hace `GET /materiales?unidad=kg`
- **THEN** la respuesta incluye solo materiales con unidad `kg`

#### Scenario: Filtro inválido
- **WHEN** el cliente hace `GET /materiales?bajoStock=quizas`
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

### Requirement: Orden y paginación de materiales
`GET /materiales` SHALL aceptar `sort` con `id`, `nombre` o `stock` (prefijo `-` para descendente; otro valor responde 400) y paginar con `page` y `limit` igual que el listado de clientes (por defecto 1 y 20, `limit` máximo 100, después de filtrar y ordenar).

#### Scenario: Orden por stock descendente
- **WHEN** el cliente hace `GET /materiales?sort=-stock`
- **THEN** los materiales vienen del mayor al menor stock

#### Scenario: Página de materiales
- **GIVEN** existen 5 materiales
- **WHEN** el cliente hace `GET /materiales?page=2&limit=2`
- **THEN** la respuesta contiene el 3.º y el 4.º material

### Requirement: Modificación de material
La API SHALL actualizar un material con `PUT /materiales/:id` modificando solo los campos enviados (`nombre`, `unidad`, `stock`, `stockMinimo`, con las mismas reglas que el alta) y responder 200. Body sin campos válidos responde 400; id inexistente, 404 `MATERIAL_NO_ENCONTRADO`.

#### Scenario: Reposición de stock
- **GIVEN** el material 1 tiene stock 2
- **WHEN** el cliente hace `PUT /materiales/1` con `{ "stock": 20 }`
- **THEN** la respuesta es 200 con stock 20 y el resto de los campos sin cambios

#### Scenario: Actualizar inexistente
- **WHEN** el cliente hace `PUT /materiales/999` con un body válido
- **THEN** la respuesta es 404 con `error.code` igual a `MATERIAL_NO_ENCONTRADO`

### Requirement: Baja de material
La API SHALL eliminar un material con `DELETE /materiales/:id` y responder 204 sin cuerpo; si no existe responde 404 `MATERIAL_NO_ENCONTRADO`.

#### Scenario: Material eliminado
- **WHEN** el cliente hace `DELETE /materiales/1` y el material existe
- **THEN** la respuesta es 204 y un `GET /materiales/1` posterior responde 404

#### Scenario: Eliminar inexistente
- **WHEN** el cliente hace `DELETE /materiales/999`
- **THEN** la respuesta es 404 con `error.code` igual a `MATERIAL_NO_ENCONTRADO`

### Requirement: Material en uso no eliminable
La baja de un material que figura en al menos un encargo, en cualquier estado, SHALL responder 409 con código `MATERIAL_EN_USO` y no eliminarlo.

#### Scenario: Baja de material usado
- **GIVEN** el material 1 figura en un encargo
- **WHEN** se hace `DELETE /materiales/1`
- **THEN** la respuesta es 409 con `error.code` igual a `MATERIAL_EN_USO` y el material sigue existiendo
