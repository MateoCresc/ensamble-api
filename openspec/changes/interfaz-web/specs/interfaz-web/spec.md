# Spec Delta

## Purpose

Interfaz web para operar clientes, materiales y encargos sobre la API de Ensamble, mostrar sus errores de forma legible y levantarse junto con ella con un solo comando.

## ADDED Requirements

### Requirement: Arranque conjunto
El proyecto SHALL ofrecer en la raíz un comando de instalación que instale las dependencias de la API y de la interfaz, y un comando que levante ambas a la vez, con la interfaz comunicándose con la API sin configuración adicional del navegador.

#### Scenario: Levantar todo con un comando
- **GIVEN** las dependencias instaladas con `npm run setup` y un `.env` válido
- **WHEN** se ejecuta `npm run dev:all`
- **THEN** la API responde en `http://localhost:3000` y la interfaz en `http://localhost:4200`, y la interfaz obtiene datos de la API

#### Scenario: Recarga en una ruta de la interfaz
- **GIVEN** la interfaz abierta en la sección Clientes
- **WHEN** se recarga el navegador
- **THEN** se vuelve a ver la sección Clientes y no la respuesta JSON de la API

### Requirement: Navegación entre secciones
La interfaz SHALL mostrar una barra con las secciones Clientes, Materiales y Encargos, y abrir Encargos al entrar a la raíz.

#### Scenario: Entrada a la raíz
- **WHEN** se abre `http://localhost:4200/`
- **THEN** se muestra la sección Encargos

#### Scenario: Cambio de sección
- **WHEN** se elige Materiales en la barra
- **THEN** se muestra el listado de materiales

### Requirement: Indicador de estado de la API
La interfaz SHALL indicar si la API está disponible consultando `/health` al iniciar.

#### Scenario: API disponible
- **WHEN** `/health` responde 200
- **THEN** el indicador muestra la API como disponible

#### Scenario: API caída
- **WHEN** `/health` no responde
- **THEN** el indicador muestra la API como no disponible

### Requirement: Avisos de error de la API
Ante una respuesta de error de la API, la interfaz SHALL mostrar un aviso con el `message` del error y su `code`; si hay `details` de validación, SHALL listar cada campo con su mensaje. La pantalla no pierde los datos cargados en el formulario.

#### Scenario: Regla de negocio rechazada
- **WHEN** la API responde 409 `{ error: { code: "EMAIL_DUPLICADO", message: "..." } }`
- **THEN** se muestra un aviso de error con ese mensaje y el código `EMAIL_DUPLICADO`

#### Scenario: Error de validación con detalles
- **WHEN** la API responde 400 `VALIDATION_ERROR` con `details: [{ field: "email", message: "El email no tiene un formato válido" }]`
- **THEN** el aviso incluye `email: El email no tiene un formato válido`

#### Scenario: Sin conexión con la API
- **WHEN** un pedido no obtiene respuesta del servidor
- **THEN** se muestra un aviso indicando que no se pudo conectar con la API

### Requirement: Gestión de clientes
La sección Clientes SHALL listar los clientes (id, nombre, email, teléfono) con filtro por nombre y paginación, y permitir dar de alta, editar y eliminar, pidiendo confirmación antes de eliminar.

#### Scenario: Alta de cliente
- **WHEN** se completa el formulario con nombre y email válidos y se guarda
- **THEN** se envía `POST /clientes`, se muestra un aviso de éxito y el cliente aparece en el listado

#### Scenario: Edición de cliente
- **WHEN** se edita el teléfono de un cliente y se guarda
- **THEN** se envía `PUT /clientes/:id` y el listado muestra el teléfono nuevo

#### Scenario: Baja bloqueada por encargos
- **GIVEN** un cliente con encargos
- **WHEN** se confirma su eliminación
- **THEN** se muestra el aviso `CLIENTE_CON_ENCARGOS` y el cliente sigue en el listado

#### Scenario: Baja cancelada
- **WHEN** se pide eliminar un cliente y se rechaza la confirmación
- **THEN** no se envía ningún pedido a la API

### Requirement: Gestión de materiales
La sección Materiales SHALL listar los materiales (id, nombre, unidad, stock, stock mínimo) con filtro por nombre y por bajo stock y paginación, y permitir dar de alta, editar y eliminar con confirmación. La unidad se elige entre `unidad`, `m`, `m2`, `kg` y `l`.

#### Scenario: Alta de material
- **WHEN** se carga nombre, unidad, stock y stock mínimo válidos y se guarda
- **THEN** se envía `POST /materiales` y el material aparece en el listado

#### Scenario: Baja bloqueada por uso
- **GIVEN** un material usado en un encargo
- **WHEN** se confirma su eliminación
- **THEN** se muestra el aviso `MATERIAL_EN_USO` y el material sigue en el listado

### Requirement: Marca de stock bajo
En el listado de materiales, la interfaz SHALL resaltar con una etiqueta "Stock bajo" los materiales cuyo stock es menor o igual a su stock mínimo.

#### Scenario: Material en el mínimo
- **GIVEN** un material con stock 5 y stock mínimo 5
- **THEN** su fila muestra la etiqueta "Stock bajo"

#### Scenario: Material con stock suficiente
- **GIVEN** un material con stock 6 y stock mínimo 5
- **THEN** su fila no muestra la etiqueta

### Requirement: Listado de encargos
La sección Encargos SHALL listar los encargos (id, cliente, descripción, estado, fecha estimada de entrega) con filtros por estado y por cliente y paginación, mostrando el estado con una etiqueta distinguible por estado.

#### Scenario: Filtro por estado
- **WHEN** se elige el estado `confirmado` en el filtro
- **THEN** el listado muestra solo encargos confirmados

### Requirement: Alta y edición de encargos
La interfaz SHALL permitir crear un encargo eligiendo un cliente existente, una descripción, una fecha estimada opcional y renglones de material y cantidad (sin repetir material). Solo un encargo `presupuestado` SHALL ofrecer edición, y en ella no se puede cambiar el cliente.

#### Scenario: Alta con materiales
- **WHEN** se elige un cliente, se escribe la descripción, se agregan dos renglones de materiales distintos con cantidades positivas y se guarda
- **THEN** se envía `POST /encargos` con `clienteId`, `descripcion`, `fechaEntregaEstimada` en formato `AAAA-MM-DD` o `null`, y `materiales` como `[{ materialId, cantidad }]`

#### Scenario: Material repetido en el formulario
- **WHEN** se intenta agregar un renglón con un material ya elegido
- **THEN** el formulario lo impide y no se envía el pedido

#### Scenario: Encargo no presupuestado
- **GIVEN** un encargo `confirmado`
- **THEN** la interfaz no ofrece editarlo

### Requirement: Acciones del ciclo de vida
Cada encargo SHALL ofrecer solo las acciones válidas para su estado: `presupuestado` → Confirmar y Cancelar; `confirmado` → Iniciar y Cancelar; `en_produccion` → Entregar; `entregado` y `cancelado` → ninguna. Eliminar SHALL ofrecerse solo en `presupuestado` y `cancelado`. Tras una acción exitosa el listado refleja el estado nuevo.

#### Scenario: Acciones de un presupuestado
- **GIVEN** un encargo `presupuestado`
- **THEN** se ofrecen Confirmar, Cancelar, Editar y Eliminar

#### Scenario: Acciones de un entregado
- **GIVEN** un encargo `entregado`
- **THEN** no se ofrece ninguna acción de ciclo de vida ni Eliminar

#### Scenario: Confirmación exitosa
- **WHEN** se confirma un encargo presupuestado con stock suficiente
- **THEN** se envía `PUT /encargos/:id/confirmar`, el encargo pasa a `confirmado` en el listado y el stock descontado se ve al abrir Materiales

#### Scenario: Confirmación sin stock
- **WHEN** se confirma un encargo y la API responde 409 `STOCK_INSUFICIENTE`
- **THEN** el aviso indica por cada material faltante su nombre, la cantidad requerida y la disponible, y el encargo sigue `presupuestado`
