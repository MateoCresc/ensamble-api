# Spec Delta

## Purpose

Garantiza que todo error de la API llegue al cliente con el mismo formato y el código HTTP correcto, para que los consumidores puedan manejarlos de forma uniforme.

## ADDED Requirements

### Requirement: Formato único de error
Toda respuesta de error SHALL tener el cuerpo `{ "error": { "code", "message", "details"? } }`, donde `code` es un identificador en MAYÚSCULAS_CON_GUIONES, `message` es un texto legible y `details` aparece solo cuando hay información adicional.

#### Scenario: Error de dominio con detalles
- **WHEN** una operación falla con un error de dominio que incluye detalles
- **THEN** la respuesta tiene el código HTTP del error y el cuerpo incluye `error.code`, `error.message` y `error.details`

#### Scenario: Error de dominio sin detalles
- **WHEN** una operación falla con un error de dominio sin detalles
- **THEN** el cuerpo incluye `error.code` y `error.message` y no incluye la clave `details`

### Requirement: Ruta inexistente
La API SHALL responder 404 con código `NOT_FOUND` a cualquier combinación de método y ruta que no esté definida, indicando el método y la ruta en el mensaje.

#### Scenario: Ruta no definida
- **WHEN** el cliente hace `GET /no-existe`
- **THEN** la respuesta es 404 con `error.code` igual a `NOT_FOUND` y un mensaje que menciona `GET /no-existe`

### Requirement: Cuerpo JSON mal formado
La API SHALL responder 400 con código `INVALID_JSON` cuando el cuerpo de la petición declara JSON pero no se puede interpretar.

#### Scenario: JSON inválido
- **WHEN** el cliente envía `POST` con `Content-Type: application/json` y el cuerpo `{ "nombre": `
- **THEN** la respuesta es 400 con `error.code` igual a `INVALID_JSON`

### Requirement: Error inesperado
La API SHALL responder 500 con código `INTERNAL_ERROR` y un mensaje genérico ante cualquier error no previsto, sin exponer detalles internos ni el stack trace.

#### Scenario: Excepción no controlada
- **WHEN** ocurre una excepción que no es un error de dominio
- **THEN** la respuesta es 500 con `error.code` igual a `INTERNAL_ERROR` y el cuerpo no contiene el stack trace
