# Design

## Context

Ver proposal.md - Why. Parte de lo que deja `persistencia-materiales`: `createDaos` (memoria / Sequelize por instancia), `defineModels`, DAOs de clientes y materiales con la misma interfaz, suite HTTP corriendo en ambos modos. Referencia: `clase_10` y `clase_13` de la cursada (`LoanModel` como tabla intermedia, `LoansSequelizeDao.lend()` con UPDATE condicional dentro de una transacción, `registerAlertListeners`, `notifierFactory`).

## Goals / Non-Goals

**Goals:**
- Confirmar y cancelar son atómicos en ambos modos: o se aplican todos los movimientos de stock y el cambio de estado, o ninguno.
- Las reglas de estado y de stock viven en los casos de uso; el DAO solo garantiza la atomicidad.
- Cambiar el canal de un aviso es configuración, no código.

**Non-Goals:**
- Concurrencia entre procesos (un solo servidor).
- Reintentos o cola de notificaciones.

## Decisions

### D1. Modelo de datos y asociaciones centralizadas
- `encargos`: `id`, `clienteId` (FK a clientes, NOT NULL), `descripcion`, `estado` (texto, por defecto `presupuestado`), `fechaEntregaEstimada` (`DATEONLY`, nullable).
- `encargo_materiales`: `encargoId`, `materialId` (PK compuesta), `cantidad` (`DECIMAL(10,2)`).
- En `defineModels`: `Cliente.hasMany(Encargo)` / `Encargo.belongsTo(Cliente, as "cliente")`, y `Encargo.belongsToMany(Material, { through: EncargoMaterial, as "materiales" })` más `Material.belongsToMany(Encargo, …)`, igual que `models/index.js` de la cursada.
- Las FK quedan con `onDelete: "RESTRICT"`: la base también impide borrar un cliente o material referenciado, además de las reglas de los casos de uso.

### D2. Forma de la respuesta
`{ id, clienteId, cliente: { id, nombre }, descripcion, estado, fechaEntregaEstimada, materiales: [{ materialId, nombre, unidad, cantidad }] }`. Los materiales se ordenan por `materialId`. El DAO en memoria arma `cliente` y `materiales` consultando los DAO de clientes y materiales que recibe por constructor (como `LoansMemoryDao` con libros y usuarios); el Sequelize usa `include`. Ambos convierten `cantidad` a `Number`.

### D3. Estados como máquina de transiciones en el dominio
`usecases/encargos/estados.js` define las transiciones permitidas por acción:
`confirmar: presupuestado → confirmado`, `cancelar: presupuestado | confirmado → cancelado`, `iniciar: confirmado → en_produccion`, `entregar: en_produccion → entregado`; editable y eliminable según D7. Un solo helper `asegurarTransicion(encargo, accion)` lanza `TRANSICION_INVALIDA` con `{ estadoActual, accion }`. Así una regla nueva en la defensa ("no se puede cancelar un confirmado") es un cambio de una línea.

### D4. Confirmar y cancelar: chequeo en el caso de uso + atomicidad en el DAO
1. El caso de uso valida existencia (404), transición (409), que tenga materiales (409) y calcula los faltantes comparando cantidad contra stock: si hay alguno lanza `STOCK_INSUFICIENTE` con el detalle por material. Esto da el mensaje útil.
2. Luego llama a `encargosDao.confirmar(id)` / `encargosDao.cancelar(id)`, que aplican estado + stock **atómicamente**:
   - Sequelize: `sequelize.transaction()` con `UPDATE encargos SET estado=… WHERE id=? AND estado IN (…)` y, por cada material, `UPDATE materiales SET stock = stock - ? WHERE id=? AND stock >= ?` (o `+` al reponer). Si alguna actualización afecta 0 filas, se lanza dentro de la transacción y se deshace todo; el DAO devuelve `null`.
   - Memoria: verifica estado y stocks y aplica los cambios **sin ningún `await` entre la verificación y la escritura**, a través de un método síncrono-en-su-núcleo `materialesDao.ajustarStock(movimientos)` que es todo-o-nada.
3. Si el DAO devuelve `null` (otro pedido cambió el stock o el estado entre el chequeo y la escritura), el caso de uso relee y vuelve a lanzar el 409 que corresponda.
El DAO de encargos puede tocar la tabla de materiales porque la operación es una sola unidad de trabajo, igual que `lend()` toca `books` en la cursada.
*Alternativa:* un servicio de "unidad de trabajo" que coordine dos DAO; más general, pero agrega una abstracción que el TP no necesita.

### D5. Redondeo de cantidades
Las restas y sumas de stock se redondean a 2 decimales (`Math.round(x * 100) / 100`) en memoria; en SQLite se aplica `ROUND(stock - ?, 2)`. Así `12.5 - 4.5` da `8` en ambos modos.

### D6. Eventos, listeners y notificadores
- `events/eventNames.js`: `ENCARGO_CONFIRMADO = "encargo.confirmado"`, `MATERIAL_STOCK_BAJO = "material.stockBajo"`. `events/eventBus.js`: `createEventBus()` → `new EventEmitter()`, creado en el contenedor e inyectado en los casos de uso (`makeEncargosUseCases({ …, eventBus })`).
- `confirmarEncargo` emite `encargo.confirmado` con `{ encargoId, cliente, cantidadMateriales }` y, por cada material cuyo stock resultante sea `<= stockMinimo`, `material.stockBajo` con `{ materialId, nombre, stock, stockMinimo, unidad }`. Emite **después** de confirmar: un evento describe algo que ya pasó.
- `listeners/registrarListeners.js` recibe `(eventBus, { notificadorEncargos, notificadorStock })` y suscribe un listener por evento. Cada listener es `async`, arma `{ asunto, mensaje }` y llama a `notificador.notificar(...)` dentro de `try/catch`; ante un error hace `console.error` y no relanza.
- `notifications/`: `consoleNotifier`, `createFileNotifier({ ruta })` (agrega una línea con fecha ISO) y `notifierFactory.crearNotificador(tipo, opciones)`. Contrato común: `notificar({ asunto, mensaje })`.
- Config: `NOTIFIER_ENCARGOS` (`console`), `NOTIFIER_STOCK` (`file`), `NOTIFICATIONS_FILE` (`./notificaciones.log`, ignorado por `*.log`).
- En tests HTTP el contenedor recibe notificadores falsos por opción (`notificadores`) para no escribir archivos ni ensuciar la consola.

### D7. Reglas de edición y baja
- Editable y eliminable solo en `presupuestado`; eliminable también en `cancelado`. Errores: `ENCARGO_NO_EDITABLE`, `ENCARGO_NO_ELIMINABLE` (409).
- `clienteId` no se puede cambiar (no está en el schema de actualización).
- Al crear o reemplazar materiales, el caso de uso verifica que existan todos (404 `MATERIAL_NO_ENCONTRADO` con `details: { ids }`). Los ids repetidos y las cantidades inválidas los rechaza el schema (400).

### D8. Reglas cruzadas en clientes y materiales
`eliminarCliente` y `eliminarMaterial` reciben `encargosDao` por la factory (`makeClientesUseCases({ clientesDao, encargosDao })`) y consultan `encargosDao.existePorCliente(id)` / `existePorMaterial(id)` antes de borrar. El 404 se sigue chequeando primero.

### D9. Validaciones de entrada
`fechaEntregaEstimada` con `z.iso.date()` (nullable). `materiales` como array de `{ materialId: entero positivo, cantidad: > 0 y <= 2 decimales }` con un `refine` que rechaza `materialId` repetidos. Filtros: `clienteId` entero, `estado` enum de los cinco estados, `sort` `id|-id`, `page`/`limit` como siempre.

### D10. Acciones como `PUT /encargos/:id/<accion>`
Cada transición es un endpoint propio (`confirmar`, `cancelar`, `iniciar`, `entregar`) que responde 200 con el encargo, como `PUT /loans/:id/return` y `/renew` en la cursada. Es más legible en Swagger y en la defensa que un `PATCH` genérico de `estado`.

## Risks / Trade-offs

- [El DAO de encargos conoce la tabla de materiales] → aceptado para garantizar la transacción (D4); documentado.
- [La memoria no tiene transacciones reales] → la atomicidad se logra por no ceder el event loop entre verificar y escribir; está probado por los mismos tests de contrato que el DAO Sequelize.
- [Change grande] → se aplica en 7 grupos con su commit cada uno.
- [Eventos síncronos de `EventEmitter` con listeners `async`] → el listener no bloquea la respuesta, pero un error no capturado sería un rechazo sin manejar: por eso cada listener tiene su propio `try/catch` (exigido por la consigna).
