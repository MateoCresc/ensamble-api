# Design

## Context

Ver proposal.md - Why. La API (Express 5, puerto 3000) expone `/clientes`, `/materiales`, `/encargos` (más `/encargos/:id/{confirmar|cancelar|iniciar|entregar}`), `/health` y `/api-docs`, **en la raíz y sin prefijo** y **sin CORS**. Los listados devuelven un array plano (paginan solo si se pide `page`/`limit`, sin total). Los errores tienen la forma `{ error: { code, message, details? } }`; `VALIDATION_ERROR` trae `details: [{ field, message }]` y `STOCK_INSUFICIENTE` trae `details: [{ materialId, nombre, requerido, disponible }]`. La máquina de estados de la API está en `usecases/encargos/estados.js` (`TRANSICIONES`, `EDITABLES`, `ELIMINABLES`).

Restricciones: el `vitest.config.js` de la raíz ya incluye solo `tests/**/*.test.js`, así que no levanta los tests de `web/`. `.gitignore` ya ignora `node_modules/` en cualquier nivel. Angular 22 exige Node `^22.22.3 || ^24.15.0`: el autor actualiza Node antes del grupo 1 (decisión confirmada); el CI usa `node-version: 22`, que resuelve a la última 22.x.

## Goals / Non-Goals

**Goals:**
- La UI es un cliente más de la API: no se agrega ni cambia nada del lado del servidor.
- La lógica que decide qué mostrar o enviar es pura y está testeada; los componentes solo la conectan con PrimeNG.
- Un solo comando levanta todo para desarrollar.

**Non-Goals:**
- Que la UI sea la autoridad de las reglas: la API sigue validando; la UI solo evita pedidos obviamente inválidos y muestra el 4xx si igual ocurre.
- Estado global (NgRx u otro), SSR, PWA.

## Decisions

### D1. Proyecto Angular independiente en `web/`
`ng new web` (standalone components, routing, SCSS, sin SSR) con su propio `package.json` y `package-lock.json`. Sin npm workspaces: la API y la UI no comparten código y así `npm ci` de la raíz y el CI de la API no cambian. Versiones fijadas exactas (sin `^`), elegidas con al menos dos semanas de publicadas al momento de instalar: referencia Angular `22.2.5`, PrimeNG `22.1.4`, `@primeuix/themes` `3.1.0`; `primeicons`, `jsdom` y `concurrently` en su última versión que cumpla esa regla.
*Alternativa:* workspaces de npm; ahorra un `install` pero mezcla los lockfiles y el CI de la API pasaría a instalar Angular.

### D2. Proxy con prefijo `/api`
La UI llama siempre a `/api/<recurso>` y `web/proxy.conf.json` reenvía `/api/**` a `http://localhost:3000` reescribiendo `^/api` → `""`. El prefijo es necesario porque las rutas de la UI (`/clientes`, `/materiales`, `/encargos`) coinciden con las de la API: sin él, recargar el navegador en `/clientes` devolvería el JSON de la API (escenario "Recarga en una ruta de la interfaz"). La base `/api` vive en una constante `API_BASE` de `web/src/app/core/api/`.
*Alternativa:* CORS en Express; obliga a cambiar la API (middleware, config, spec y tests) y a manejar la URL absoluta de la API en la UI.

### D3. Estructura de `web/src/app/`
```
core/
  api/         clientes.api.ts, materiales.api.ts, encargos.api.ts, health.api.ts  (HttpClient, tipos)
  errores/     traducirError.ts (puro) + errores.interceptor.ts (toast)
  modelos.ts   tipos Cliente, Material, Encargo, EstadoEncargo, ErrorApi
dominio/
  encargos.ts  accionesDisponibles(estado), esEditable, esEliminable, severidadEstado, armarBodyEncargo
  materiales.ts esStockBajo(material)
features/
  clientes/ materiales/ encargos/   páginas (tabla + diálogo de formulario)
layout/        barra de navegación + indicador de API
```
Nombres de dominio en español, como en la API; los archivos siguen la convención de Angular (`*.ts`, `*.spec.ts`).

### D4. Reglas de presentación del ciclo de vida, espejadas de la API
`dominio/encargos.ts` define una tabla `ACCIONES_POR_ESTADO` equivalente a `TRANSICIONES`, `EDITABLES` y `ELIMINABLES` de `usecases/encargos/estados.js` (ver spec "Acciones del ciclo de vida"). Es una copia deliberada: la UI no puede importar código de la API (otro proyecto, otro lenguaje) y la API no expone las transiciones. Si ambas divergen, la API responde 409 `TRANSICION_INVALIDA` y la UI lo muestra.
*Alternativa:* agregar un campo `accionesDisponibles` a la respuesta de `/encargos`; es más robusto pero cambia el contrato de la API, fuera de alcance.

### D5. Errores centralizados en un interceptor
`traducirError(HttpErrorResponse) → { severidad, titulo, detalle }`, pura:
- `status 0` → "No se pudo conectar con la API".
- Cuerpo `{ error: { code, message } }` → título `message`, código `code`.
- `VALIDATION_ERROR` → una línea `field: message` por cada `details`.
- `STOCK_INSUFICIENTE` → una línea `nombre: requiere X, hay Y` por material.
- Cualquier otro cuerpo → "Error inesperado (status)".
Un `HttpInterceptorFn` la aplica y publica el resultado en el `MessageService` de PrimeNG (`p-toast` en el layout), y relanza el error para que la página no cierre el diálogo ni pierda el formulario. `/health` queda excluido del toast (su falla se ve en el indicador).

### D6. PrimeNG
Tema Aura con `providePrimeNG({ theme: { preset: Aura } })` y `provideAnimationsAsync()` en `app.config.ts`; `primeicons` en `styles`. Componentes: `p-menubar`, `p-table` (paginación y orden **en el cliente**, `[paginator]`, `[rows]=10`), `p-dialog` con formularios reactivos, `p-confirmdialog` + `ConfirmationService` para bajas, `p-toast`, `p-select` (clientes, materiales, unidad, estado), `p-datepicker` (fecha → `AAAA-MM-DD`), `p-inputnumber` (hasta 2 decimales), `p-tag` (estado y "Stock bajo"), `p-button`.
Filtros: los de nombre y bajo stock se mandan como query a la API (`GET /materiales?nombre=…&bajoStock=true`, `GET /encargos?estado=…&clienteId=…`); la paginación es local porque la API no devuelve total.

### D7. Formularios reactivos con validaciones básicas
Validadores del lado de la UI solo para lo que da feedback inmediato (obligatorios, largos mínimos, email, números ≥ 0, sin material repetido). Las reglas de negocio (email único, nombre único, stock) las decide la API y se ven por D5. El armado del body de encargo (fecha `Date` → `AAAA-MM-DD` o `null`, renglones → `[{ materialId, cantidad }]`, omitir `clienteId` al editar) vive en `armarBodyEncargo`, pura y testeada.

### D8. Testing (TDD sobre lógica y servicios)
Runner unit-test del CLI de Angular con Vitest y `jsdom` (`ng test`, `npm test` en `web/` = `ng test --watch=false`). Se testea con TDD:
- `dominio/*.ts` (funciones puras): `accionesDisponibles`, `esEditable`, `esEliminable`, `esStockBajo`, `armarBodyEncargo`.
- `core/errores/traducirError.ts`.
- `core/api/*.api.ts` con `provideHttpClientTesting` + `HttpTestingController`: método, URL con `/api`, query y body.
Los componentes y pantallas no tienen tests (ver proposal - fuera de alcance); se cubren con la tarea de verificación manual de cada grupo. Los tests de servicios y dominio nombran el escenario de la spec que respaldan.

### D9. Arranque conjunto con `concurrently`
En el `package.json` de la raíz:
- `"setup": "npm install && npm --prefix web install"`
- `"dev:web": "npm --prefix web start"` (en `web/`, `start` = `ng serve --proxy-config proxy.conf.json`)
- `"dev:all": "concurrently -k -n api,web -c blue,magenta \"npm run dev\" \"npm run dev:web\""`
`-k` corta ambos procesos si uno termina. `npm run dev` sigue usando `--env-file=.env`.
*Alternativa:* `postinstall` que instale `web/`; se descarta porque haría que el `npm ci` del CI de la API también instale Angular.

### D10. CI y reglas para agentes
- `ci.yml`: job nuevo `web` (independiente del de la API) con `working-directory: web`, `actions/setup-node` con `cache-dependency-path: web/package-lock.json`, `npm ci`, `npm test`, `npm run build`.
- `AGENTS.md`: sección "Front (`web/`)" que indica que TypeScript se permite solo en `web/`, que TDD aplica a `dominio/`, `core/errores/` y `core/api/` (rojo → verde como en §3), que los componentes se verifican a mano y que la UI no cambia contratos de la API.

## Risks / Trade-offs

- [Reglas de estado duplicadas entre API y UI] → Tabla única en `dominio/encargos.ts` con tests por escenario; si divergen, la API responde 409 y el aviso lo hace visible.
- [Listados sin total: con muchos registros se trae todo] → Aceptable para una herramienta de prueba; si molesta, change aparte en la API para paginación con total.
- [Versiones nuevas de Angular/PrimeNG cambian APIs de componentes] → Versiones exactas fijadas (D1) y build en CI.
- [Node local desactualizado rompe `ng`] → Tarea 1.1 verifica `node -v` antes de crear el proyecto.
- [El tamaño de `web/node_modules` y el tiempo de CI] → Job separado con caché por lockfile.
