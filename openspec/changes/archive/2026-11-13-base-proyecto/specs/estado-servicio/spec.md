# Spec Delta

## Purpose

Permite comprobar rápidamente que la API está en funcionamiento y con qué tipo de persistencia fue iniciada, útil para verificar el cambio de persistencia en vivo.

## ADDED Requirements

### Requirement: Consulta de estado
La API SHALL exponer `GET /health`, que responde 200 con `{ "status": "ok", "persistence": <tipo> }`, donde `<tipo>` es la persistencia configurada al arrancar (`memory` o `sequelize`).

#### Scenario: Servicio activo en memoria
- **GIVEN** la API arrancó con persistencia `memory`
- **WHEN** el cliente hace `GET /health`
- **THEN** la respuesta es 200 con `status` igual a `ok` y `persistence` igual a `memory`

#### Scenario: Servicio activo con base de datos
- **GIVEN** la API arrancó con persistencia `sequelize`
- **WHEN** el cliente hace `GET /health`
- **THEN** la respuesta es 200 con `persistence` igual a `sequelize`
