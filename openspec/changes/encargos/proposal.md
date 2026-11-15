# Proposal

## Why

Es el corazón del dominio: un encargo es el trabajo que un cliente le pide al taller y consume materiales. Con él se completan la relación entre entidades y las reglas de negocio (1 punto) y los eventos (1 punto), y se suman tres opcionales: relación N a N con tabla intermedia, una operación atómica sobre dos entidades (confirmar descuenta stock) y un segundo evento con otro notificador. Se agrupan en un solo change porque los eventos los emite justamente la confirmación, como las alertas de stock bajo y los préstamos de la `clase_10` de la cursada.

Cubre de la consigna: 2.2 (relación 1 a N y reglas en casos de uso), 2.4 (asociaciones centralizadas y ambos modos iguales), 2.6 (bus de eventos, listener en módulo aparte, notificador con interfaz propia, errores capturados), 2.7 (endpoints documentados) y los opcionales N a N + transacción y segundo evento.

## What Changes

- Recurso `/encargos`: un encargo pertenece a un cliente (1 a N) y lista materiales con su cantidad (N a N mediante `EncargoMaterial`).
- Ciclo de vida con acciones explícitas: `presupuestado → confirmado → en_produccion → entregado`, y `cancelado` desde presupuestado o confirmado.
- **Confirmar** descuenta el stock de todos los materiales en una sola operación atómica; si falta stock de alguno responde 409 `STOCK_INSUFICIENTE` y no modifica nada. **Cancelar** un encargo confirmado repone el stock.
- Eventos de dominio `encargo.confirmado` y `material.stockBajo`, con listeners en módulo aparte y notificadores intercambiables por configuración (consola y archivo).
- Reglas cruzadas: no se puede eliminar un cliente con encargos (409 `CLIENTE_CON_ENCARGOS`) ni un material usado en encargos (409 `MATERIAL_EN_USO`).

## Capabilities

### New Capabilities
- `encargos`: alta, consulta, modificación y baja de encargos con sus materiales, y su ciclo de estados con control de stock.
- `notificaciones`: avisos que la API genera ante hechos del dominio (encargo confirmado, material con stock bajo) por canales configurables.

### Modified Capabilities
- `clientes`: se agrega la regla de que un cliente con encargos no puede eliminarse.
- `materiales`: se agrega la regla de que un material usado en encargos no puede eliminarse.

## Impact

- Código nuevo: `dao/encargos/` (memoria y Sequelize), modelos `EncargoModel` y `EncargoMaterialModel` con asociaciones en `dao/models/index.js`, `usecases/encargos/`, `schemas/encargos.schema.js`, `controllers/encargos.controller.js`, `routes/encargos.routes.js`, `events/`, `listeners/`, `notifications/` y sus tests.
- Cambios: `dao/daoFactory.js`, `container/container.js`, casos de uso de baja de clientes y materiales, `config/config.js`, `.env.example`, `docs/openapi.yaml`, `requests.http`, `README.md`.
- Sin dependencias nuevas (`node:events` y `node:fs`).
- **Depende de** `persistencia-materiales` (PR #4) mergeado y archivado.
- Fuera de alcance: fechas validadas contra "hoy" (requeriría reloj inyectado), precios y presupuestos con importes, cambio de cliente de un encargo, notificaciones por email.
