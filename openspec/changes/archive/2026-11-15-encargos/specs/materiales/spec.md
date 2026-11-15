# Spec Delta

## ADDED Requirements

### Requirement: Material en uso no eliminable
La baja de un material que figura en al menos un encargo, en cualquier estado, SHALL responder 409 con código `MATERIAL_EN_USO` y no eliminarlo.

#### Scenario: Baja de material usado
- **GIVEN** el material 1 figura en un encargo
- **WHEN** se hace `DELETE /materiales/1`
- **THEN** la respuesta es 409 con `error.code` igual a `MATERIAL_EN_USO` y el material sigue existiendo
