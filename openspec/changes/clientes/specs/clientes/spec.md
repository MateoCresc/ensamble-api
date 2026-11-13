# Spec Delta

## Purpose

Gestiona los clientes del taller: personas o empresas que encargan trabajos a medida. Es la entidad a la que luego se asocian los encargos.

## ADDED Requirements

### Requirement: Alta de cliente
La API SHALL permitir crear un cliente con `POST /clientes` enviando `nombre` (obligatorio, mínimo 2 caracteres), `email` (obligatorio, formato válido) y `telefono` (opcional). Responde 201 con el cliente creado, que incluye un `id` entero asignado por el sistema, y el header `Location` con `/clientes/<id>`.

#### Scenario: Cliente creado
- **WHEN** el cliente envía `POST /clientes` con `{ "nombre": "Ana Pérez", "email": "ana@mail.com" }`
- **THEN** la respuesta es 201 con `id` entero, `nombre`, `email` y `telefono` en `null`, y el header `Location` es `/clientes/<id>`

#### Scenario: Id enviado por el cliente
- **WHEN** el body de `POST /clientes` incluye un campo `id`
- **THEN** el `id` enviado se ignora y el sistema asigna uno propio

#### Scenario: Datos inválidos
- **WHEN** el cliente envía `POST /clientes` sin `nombre` o con un `email` mal formado
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR` y un elemento en `error.details` por cada campo inválido

### Requirement: Email único
El email de un cliente SHALL ser único sin distinguir mayúsculas de minúsculas, y se guarda en minúsculas. Crear o actualizar un cliente con un email que ya pertenece a otro cliente responde 409 con código `EMAIL_DUPLICADO`.

#### Scenario: Alta con email repetido
- **GIVEN** existe un cliente con email `ana@mail.com`
- **WHEN** se crea otro cliente con email `ANA@mail.com`
- **THEN** la respuesta es 409 con `error.code` igual a `EMAIL_DUPLICADO`

#### Scenario: Actualización con email de otro cliente
- **GIVEN** existen los clientes 1 (`ana@mail.com`) y 2 (`luis@mail.com`)
- **WHEN** se actualiza el cliente 2 con email `ana@mail.com`
- **THEN** la respuesta es 409 con `error.code` igual a `EMAIL_DUPLICADO`

#### Scenario: Actualización conservando el propio email
- **GIVEN** existe el cliente 1 con email `ana@mail.com`
- **WHEN** se actualiza el cliente 1 enviando el mismo email y otro `nombre`
- **THEN** la respuesta es 200 con el `nombre` modificado

### Requirement: Consulta de cliente por id
La API SHALL devolver un cliente con `GET /clientes/:id`. Si no existe responde 404 con código `CLIENTE_NO_ENCONTRADO`; si el id no es un entero positivo responde 400 con `VALIDATION_ERROR`.

#### Scenario: Cliente existente
- **GIVEN** existe el cliente con id 1
- **WHEN** el cliente hace `GET /clientes/1`
- **THEN** la respuesta es 200 con los datos del cliente 1

#### Scenario: Cliente inexistente
- **WHEN** el cliente hace `GET /clientes/999` y no existe ese id
- **THEN** la respuesta es 404 con `error.code` igual a `CLIENTE_NO_ENCONTRADO`

#### Scenario: Id inválido
- **WHEN** el cliente hace `GET /clientes/abc`
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

### Requirement: Listado de clientes
La API SHALL listar los clientes con `GET /clientes`, devolviendo 200 con un array (vacío si no hay). Sin parámetros, el orden es por `id` ascendente.

#### Scenario: Listado completo
- **GIVEN** existen 3 clientes
- **WHEN** el cliente hace `GET /clientes`
- **THEN** la respuesta es 200 con un array de 3 clientes ordenados por `id`

#### Scenario: Sin clientes
- **WHEN** no hay clientes y se hace `GET /clientes`
- **THEN** la respuesta es 200 con un array vacío

### Requirement: Filtros del listado
`GET /clientes` SHALL aceptar `nombre` (coincidencia parcial, sin distinguir mayúsculas) y `email` (coincidencia exacta, sin distinguir mayúsculas). Si se envían ambos, se aplican los dos.

#### Scenario: Filtro por nombre parcial
- **GIVEN** existen "Ana Pérez", "Mariana Gómez" y "Luis Sosa"
- **WHEN** el cliente hace `GET /clientes?nombre=ana`
- **THEN** la respuesta incluye a "Ana Pérez" y "Mariana Gómez" y no a "Luis Sosa"

#### Scenario: Filtro por email
- **WHEN** el cliente hace `GET /clientes?email=LUIS@mail.com` y existe `luis@mail.com`
- **THEN** la respuesta es un array con ese único cliente

### Requirement: Ordenamiento del listado
`GET /clientes` SHALL aceptar `sort` con los valores `id`, `nombre` o `email`, y con prefijo `-` para orden descendente. Cualquier otro valor responde 400 con `VALIDATION_ERROR`.

#### Scenario: Orden descendente por nombre
- **WHEN** el cliente hace `GET /clientes?sort=-nombre`
- **THEN** los clientes vienen ordenados por `nombre` de la Z a la A

#### Scenario: Campo de orden no permitido
- **WHEN** el cliente hace `GET /clientes?sort=telefono`
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

### Requirement: Paginación del listado
`GET /clientes` SHALL paginar cuando recibe `page` o `limit` (enteros positivos, `limit` máximo 100), con valores por defecto `page=1` y `limit=20`. La paginación se aplica después de filtrar y ordenar. Sin esos parámetros devuelve todos los resultados.

#### Scenario: Segunda página
- **GIVEN** existen 5 clientes
- **WHEN** el cliente hace `GET /clientes?page=2&limit=2`
- **THEN** la respuesta contiene los clientes 3.º y 4.º según el orden aplicado

#### Scenario: Límite excedido
- **WHEN** el cliente hace `GET /clientes?limit=500`
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

### Requirement: Modificación de cliente
La API SHALL actualizar un cliente con `PUT /clientes/:id` modificando solo los campos enviados (`nombre`, `email`, `telefono`) y responder 200 con el cliente actualizado. Un body sin campos válidos responde 400; un id inexistente responde 404 `CLIENTE_NO_ENCONTRADO`.

#### Scenario: Actualización parcial
- **GIVEN** existe el cliente 1 con `nombre` "Ana Pérez" y `telefono` "1155550000"
- **WHEN** el cliente hace `PUT /clientes/1` con `{ "telefono": "1166660000" }`
- **THEN** la respuesta es 200 con el nuevo `telefono` y el mismo `nombre`

#### Scenario: Body vacío
- **WHEN** el cliente hace `PUT /clientes/1` con `{}`
- **THEN** la respuesta es 400 con `error.code` igual a `VALIDATION_ERROR`

#### Scenario: Actualizar inexistente
- **WHEN** el cliente hace `PUT /clientes/999` con un body válido
- **THEN** la respuesta es 404 con `error.code` igual a `CLIENTE_NO_ENCONTRADO`

### Requirement: Baja de cliente
La API SHALL eliminar un cliente con `DELETE /clientes/:id` y responder 204 sin cuerpo. Si no existe responde 404 `CLIENTE_NO_ENCONTRADO`.

#### Scenario: Cliente eliminado
- **GIVEN** existe el cliente 1
- **WHEN** el cliente hace `DELETE /clientes/1`
- **THEN** la respuesta es 204 y un `GET /clientes/1` posterior responde 404

#### Scenario: Eliminar inexistente
- **WHEN** el cliente hace `DELETE /clientes/999`
- **THEN** la respuesta es 404 con `error.code` igual a `CLIENTE_NO_ENCONTRADO`
