# Spec Delta

## Purpose

Avisa al taller de hechos relevantes del dominio por un canal configurable, sin que una falla del aviso afecte la operación que lo originó.

## ADDED Requirements

### Requirement: Aviso de encargo confirmado
Cada vez que un encargo se confirma, la API SHALL emitir un aviso con el número de encargo, el cliente y la cantidad de materiales, por el canal configurado en `NOTIFIER_ENCARGOS` (`console` por defecto, o `file`).

#### Scenario: Confirmación avisada por consola
- **GIVEN** `NOTIFIER_ENCARGOS=console`
- **WHEN** se confirma el encargo 1 del cliente "Ana Pérez"
- **THEN** la consola muestra un aviso "Encargo confirmado" que menciona el encargo 1 y a "Ana Pérez"

### Requirement: Aviso de stock bajo
Cuando una confirmación deja un material con stock menor o igual a su stock mínimo, la API SHALL emitir un aviso por ese material con su nombre, stock y mínimo, por el canal configurado en `NOTIFIER_STOCK` (`file` por defecto, en el archivo `NOTIFICATIONS_FILE`).

#### Scenario: Material por debajo del mínimo
- **GIVEN** el material "Tablón de pino" con stock 6 y mínimo 3, y `NOTIFIER_STOCK=file`
- **WHEN** se confirma un encargo que usa 4 de ese material
- **THEN** el archivo de notificaciones suma una línea "Stock bajo" con "Tablón de pino", stock 2 y mínimo 3

#### Scenario: Material que sigue por encima del mínimo
- **WHEN** una confirmación deja un material con stock mayor a su mínimo
- **THEN** no se emite aviso de stock bajo para ese material

### Requirement: Falla de aviso aislada
Si el envío de un aviso falla, la operación que lo originó SHALL completarse igual con su respuesta normal, y la falla se registra en la consola de errores.

#### Scenario: Canal caído
- **GIVEN** el canal de avisos falla al enviar
- **WHEN** se confirma un encargo
- **THEN** la respuesta es 200 con el encargo confirmado y el stock descontado
