# Spec Delta

## ADDED Requirements

### Requirement: Cliente con encargos no eliminable
La baja de un cliente que tiene al menos un encargo, en cualquier estado, SHALL responder 409 con código `CLIENTE_CON_ENCARGOS` y no eliminarlo, para conservar el historial de trabajos.

#### Scenario: Baja de cliente con encargos
- **GIVEN** el cliente 1 tiene un encargo
- **WHEN** se hace `DELETE /clientes/1`
- **THEN** la respuesta es 409 con `error.code` igual a `CLIENTE_CON_ENCARGOS` y el cliente sigue existiendo
