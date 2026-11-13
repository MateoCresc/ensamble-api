# Plan de PRs — ensamble-api

Regla: **un change de OpenSpec = una rama = un PR a `main`**. Dentro de cada PR, un commit por grupo de tareas y, al final, el commit del `/opsx:archive`. Cada rama nace de `main` actualizado después de mergear la anterior; la cadena es lineal.

Objetivo: que cada merge deje `main` en verde (la app arranca y `npm test` pasa) y que cada PR se pueda explicar solo en la defensa.

| PR | Rama | Change(s) de OpenSpec | Contenido | Criterio de la consigna | Estado |
|---|---|---|---|---|---|
| #1 | `feat/openspec-project-setup` | `base-proyecto` | Estructura, config, errores, `/health`, Swagger base | Capas, Zod y errores | ✅ mergeado |
| #2 | `feat/openspec-project-setup` | `infraestructura-tests` + archive de ambos | Vitest, supertest, `createApp`, tests de la base, plantilla de PR y CI | Calidad · opcional tests | 🔄 en curso |
| #3 | `feat/clientes` | `clientes` | Primera entidad completa en memoria, email único, filtros/orden/paginación | Capas (2) · Zod (1,5) · regla de negocio | 📝 propuesto |
| #4 | `feat/persistencia-sequelize` | `persistencia-sequelize` | Conexión SQLite, `dao/models/index.js`, `daoFactory`, DAO Sequelize de clientes, tests en ambos modos | Persistencia intercambiable (2) | ⏳ |
| #5 | `feat/materiales` | `materiales` | Segunda entidad, con los dos DAOs desde el inicio | 2 entidades con CRUD | ⏳ |
| #6 | `feat/encargos` | `encargos` | Relación 1 a N con Cliente, estados, regla "no borrar cliente con encargos activos" (MODIFIED de `clientes`) | Relación + reglas (1) | ⏳ |
| #7 | `feat/encargo-materiales` | `encargo-materiales` | N a N con cantidad, confirmar/cancelar encargo con transacción de stock | Opcional N a N + transacción | ⏳ |
| #8 | `feat/eventos` | `eventos` | Bus de eventos, `encargo.confirmado` y `material.stockBajo`, notificadores de consola y archivo | Eventos (1) · opcional 2.º evento | ⏳ |
| #9 | `chore/cierre` | `cierre` | README final, Dockerfile/compose, repaso de Swagger completo | Documentación (1) · opcional Docker | ⏳ |
| #10 | `feat/autenticacion` | `autenticacion` | JWT y hash de contraseñas (solo si sobra tiempo) | Opcional seguridad | 💭 opcional |

## Equivalencia con la cursada (`osvaldoojeda-ort/jueves_tp2a_ya`)

| PR | Rama de referencia |
|---|---|
| #3 clientes | `clase_4` a `clase_8` (libros en memoria por capas) · `clase_9` (`users`) |
| #4 persistencia | `clase_9` (Sequelize como segundo adaptador, `daoFactory`) |
| #5 materiales | práctica de `clase_9` (entidad nueva con ambos DAOs) |
| #6 / #7 encargos | `clase_10` y `clase_13` (préstamos N a N, `lend()` transaccional, reglas) |
| #8 eventos | `clase_10` (alertas de stock bajo, `notifierFactory`) |
| #10 autenticación | `clase_11` |

## Checklist antes de abrir cada PR

1. Todas las tareas del change tildadas y change archivado (último commit).
2. `npm test` en verde.
3. `npx @fission-ai/openspec validate --all --strict` sin errores.
4. Descripción con la plantilla de `.github/pull_request_template.md`.
5. Después del merge: `git switch main && git pull` y recién ahí crear la rama del próximo PR.
