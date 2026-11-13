# Spec Delta

## Purpose

Publica la documentación OpenAPI 3 de la API y una interfaz interactiva para explorarla y probar los endpoints contra el servidor en ejecución.

## ADDED Requirements

### Requirement: Interfaz de documentación
La API SHALL servir Swagger UI en `/api-docs`, cargada con la especificación OpenAPI 3 del proyecto.

#### Scenario: Acceso a la documentación
- **WHEN** el cliente abre `GET /api-docs/`
- **THEN** la respuesta es 200 con la página HTML de Swagger UI

### Requirement: Especificación descargable
La API SHALL servir la especificación OpenAPI en formato JSON en `GET /api-docs.json`.

#### Scenario: Descarga de la especificación
- **WHEN** el cliente hace `GET /api-docs.json`
- **THEN** la respuesta es 200 con un JSON cuyo campo `openapi` comienza con `3.`

### Requirement: Esquema de error reutilizable
La especificación SHALL definir el formato de error en `components/schemas` y todos los endpoints documentados SHALL referenciarlo con `$ref` en sus respuestas de error.

#### Scenario: Endpoint documentado con su error
- **WHEN** se inspecciona la documentación de `GET /health` o de cualquier endpoint futuro
- **THEN** sus respuestas de error usan `$ref: '#/components/schemas/Error'`
