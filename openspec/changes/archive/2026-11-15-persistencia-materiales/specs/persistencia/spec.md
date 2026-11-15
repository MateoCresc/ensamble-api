# Spec Delta

## Purpose

Permite que la API guarde sus datos en memoria o en una base de datos real según la configuración, sin cambiar su comportamiento observable.

## ADDED Requirements

### Requirement: Selección de persistencia por configuración
La API SHALL usar el almacenamiento indicado por la variable `PERSISTENCE_TYPE`: `memory` (en memoria, valor por defecto) o `sequelize` (base de datos SQLite en el archivo indicado por `DB_STORAGE`). Con un valor distinto, el servidor MUST NOT arrancar e informa los valores permitidos.

#### Scenario: Arranque con base de datos
- **GIVEN** `PERSISTENCE_TYPE=sequelize`
- **WHEN** el servidor arranca y se hace `GET /health`
- **THEN** la respuesta indica `persistence: sequelize` y los datos se guardan en el archivo de `DB_STORAGE`

#### Scenario: Valor inválido
- **GIVEN** `PERSISTENCE_TYPE=mongo`
- **WHEN** se intenta arrancar el servidor
- **THEN** el proceso termina con un error que lista `memory` y `sequelize`

### Requirement: Mismas respuestas en ambos modos
Ante la misma secuencia de peticiones, la API SHALL responder con los mismos códigos HTTP y cuerpos con la misma forma y valores en modo `memory` y en modo `sequelize`, para clientes y materiales.

#### Scenario: Secuencia equivalente
- **WHEN** se ejecuta la misma secuencia de altas, consultas, filtros, modificaciones, bajas y errores contra la API en cada modo
- **THEN** cada respuesta tiene el mismo código y el mismo cuerpo en ambos modos

#### Scenario: Unicidad garantizada también por la base
- **GIVEN** modo `sequelize`
- **WHEN** se intenta guardar un cliente con un email ya registrado
- **THEN** la respuesta es 409 `EMAIL_DUPLICADO`, igual que en memoria

### Requirement: Conservación de datos
En modo `sequelize` los datos SHALL conservarse entre reinicios del servidor. En modo `memory` cada arranque comienza sin datos.

#### Scenario: Reinicio con base de datos
- **GIVEN** modo `sequelize` y un cliente creado
- **WHEN** el servidor se reinicia con el mismo `DB_STORAGE`
- **THEN** `GET /clientes` incluye ese cliente

#### Scenario: Reinicio en memoria
- **GIVEN** modo `memory` y un cliente creado
- **WHEN** el servidor se reinicia
- **THEN** `GET /clientes` responde un array vacío
