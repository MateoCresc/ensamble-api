# Proposal

## Why

Hoy la API solo se prueba desde Swagger UI o `requests.http`, lo que obliga a copiar ids a mano y hace difícil mostrar el flujo central del dominio (crear un encargo, confirmarlo, ver bajar el stock, recibir `409 STOCK_INSUFICIENTE`). Con las tres entidades y el ciclo de vida ya mergeados en `main`, una interfaz web permite recorrer y demostrar el proyecto de forma visual sin tocar el contrato de la API.

Requisito de la consigna: no corresponde a un ítem obligatorio de la API (2.x); es una herramienta complementaria para la demostración y la prueba manual de los requisitos ya cubiertos (2.2 reglas de negocio, 2.4 relaciones, 2.6 eventos), que se vuelven visibles desde la UI.

## What Changes

- Nueva aplicación web en la carpeta de primer nivel `web/` (Angular + PrimeNG, con su propio `package.json`), aprobada por el autor.
- Navegación entre **Clientes**, **Materiales** y **Encargos**, con un indicador del estado de la API (`/health`).
- **Clientes** y **Materiales**: listado con filtros y paginación, alta, edición y baja con confirmación; materiales con stock bajo resaltados.
- **Encargos**: listado filtrable por estado y cliente, alta y edición con renglones de materiales, y botones de ciclo de vida (confirmar, cancelar, iniciar, entregar) que solo aparecen cuando el estado los permite.
- Los errores de la API (`{ error: { code, message, details? } }`) y la falta de conexión se muestran como avisos legibles, incluidos los 409 de reglas de negocio.
- Arranque conjunto: `npm run dev:all` en la raíz levanta API y UI con un solo comando; `npm run setup` instala las dependencias de ambas.
- La UI llama a la API mediante el proxy de desarrollo de Angular: **la API no cambia** (sin CORS ni rutas nuevas).
- CI: un job nuevo que corre los tests y el build de `web/`.
- `AGENTS.md`: sección para el front (qué exige TDD, qué se verifica a mano, TypeScript permitido solo dentro de `web/`).

## Capabilities

### New Capabilities
- `interfaz-web`: interfaz gráfica para operar clientes, materiales y encargos sobre la API, mostrar sus errores y arrancar junto con ella.

### Modified Capabilities
<!-- Ninguna: la API mantiene sus contratos y requisitos actuales. -->

## Impact

- Código nuevo: `web/` completo (app Angular, servicios HTTP, lógica de presentación y sus tests, `proxy.conf.json`).
- Cambios: `package.json` de la raíz (scripts `setup` y `dev:all`), `.github/workflows/ci.yml` (job de `web/`), `AGENTS.md`, `README.md`.
- **Dependencias nuevas, para aprobar:**
  - En `web/`: `@angular/*` y `@angular/cli` / `@angular/build` (última versión mayor estable con PrimeNG compatible, versión exacta en `design.md`), `primeng`, `@primeuix/themes`, `primeicons`, `vitest` y `jsdom` (runner de tests del CLI).
  - En la raíz: `concurrently` (devDependency) para `dev:all`.
- Sin cambios en rutas, schemas, casos de uso ni `docs/openapi.yaml` de la API.
- Fuera de alcance: autenticación, despliegue o build servido por Express, tests de componentes y end-to-end, internacionalización, tema oscuro a medida, paginación del lado del servidor y cualquier cambio de contrato en la API (si la UI revela uno necesario, se anota como change aparte).
