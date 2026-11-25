# Tasks

## 1. Preparación, andamiaje y arranque conjunto

- [ ] 1.1 Verificar que la rama es `feat/interfaz-web` creada desde `main` actualizado (con `encargos` mergeado y archivado), que `node -v` cumple `^22.22.3 || ^24.15.0` y que `npm test` de la raíz está en verde (sin commit)
- [ ] 1.2 Crear `web/` con `ng new web --skip-git --routing --style=scss --ssr=false` y la versión de Angular fijada (D1); instalar `primeng`, `@primeuix/themes`, `primeicons` con versión exacta; configurar el runner unit-test con Vitest + `jsdom` y `"test": "ng test --watch=false"`; verificar que `npm --prefix web test` y `npm --prefix web run build` terminan sin errores
- [ ] 1.3 Agregar `web/proxy.conf.json` (`/api` → `http://localhost:3000`, reescribiendo `^/api`) y `"start": "ng serve --proxy-config proxy.conf.json"` (D2); instalar `concurrently` como devDependency de la raíz y agregar los scripts `setup`, `dev:web` y `dev:all` (D9); verificar el escenario "Levantar todo con un comando" corriendo `npm run dev:all` y abriendo `http://localhost:4200/api/health`
- [ ] 1.4 Escribir `web/src/app/core/api/health.api.spec.ts` (escenarios "API disponible" / "API caída": `GET /api/health` → `true`, error de red → `false`) y `core/errores/traducirError.spec.ts` (escenarios "Regla de negocio rechazada", "Error de validación con detalles", "Sin conexión con la API" y cuerpo desconocido); verificar que fallan porque los módulos no existen
- [ ] 1.5 Implementar `core/api/health.api.ts`, `core/errores/traducirError.ts` y `errores.interceptor.ts` (D5), `core/modelos.ts` y `API_BASE`; verificar que los tests de 1.4 pasan
- [ ] 1.6 Configurar PrimeNG (tema Aura, animaciones, `MessageService`, `ConfirmationService`) en `app.config.ts` (D6); crear el layout con `p-menubar` (Clientes, Materiales, Encargos), indicador de API y `p-toast`, y rutas con `''` → `encargos` y páginas vacías por sección; verificar a mano "Entrada a la raíz", "Cambio de sección", "Recarga en una ruta de la interfaz" y el indicador con la API levantada y apagada. Commit: `web/` (salvo `node_modules/`), `package.json`, `package-lock.json`

## 2. Clientes

- [ ] 2.1 Escribir `core/api/clientes.api.spec.ts` con `HttpTestingController`: listar (`GET /api/clientes` y con `?nombre=`), crear (`POST` con body), actualizar (`PUT /api/clientes/:id`) y eliminar (`DELETE`), nombrando los escenarios "Alta de cliente" y "Edición de cliente"; verificar que fallan
- [ ] 2.2 Implementar `core/api/clientes.api.ts`; verificar que los tests de 2.1 pasan
- [ ] 2.3 Crear `features/clientes/` con `p-table` (filtro por nombre, paginación local), diálogo de alta/edición con formulario reactivo (D7) y baja con `p-confirmdialog`; verificar a mano "Alta de cliente", "Edición de cliente", "Baja cancelada", un 409 `EMAIL_DUPLICADO` y un 400 con detalles sin perder el formulario. Commit: `web/src/app/core/api/clientes.api*.ts`, `web/src/app/features/clientes/`, `web/src/app/app.routes.ts`

## 3. Materiales

- [ ] 3.1 Escribir `dominio/materiales.spec.ts` ("Material en el mínimo" → `true`, "Material con stock suficiente" → `false`, stock por debajo del mínimo → `true`) y `core/api/materiales.api.spec.ts` (listar con `nombre` y `bajoStock=true`, crear, actualizar, eliminar; escenario "Alta de material"); verificar que fallan
- [ ] 3.2 Implementar `dominio/materiales.ts` (`esStockBajo`) y `core/api/materiales.api.ts`; verificar que los tests de 3.1 pasan
- [ ] 3.3 Crear `features/materiales/` con tabla (filtros nombre y bajo stock, etiqueta "Stock bajo"), diálogo con `p-select` de unidad y `p-inputnumber` de 2 decimales, y baja con confirmación; verificar a mano "Alta de material", la etiqueta de stock bajo y "Baja bloqueada por uso" (crear antes un encargo con ese material desde Swagger). Commit: `web/src/app/dominio/materiales*.ts`, `web/src/app/core/api/materiales.api*.ts`, `web/src/app/features/materiales/`, `web/src/app/app.routes.ts`

## 4. Encargos y ciclo de vida

- [ ] 4.1 Escribir `dominio/encargos.spec.ts`: `accionesDisponibles` para los cinco estados ("Acciones de un presupuestado", "Acciones de un entregado", confirmado → Iniciar y Cancelar, en_produccion → Entregar), `esEditable` ("Encargo no presupuestado"), `esEliminable`, y `armarBodyEncargo` ("Alta con materiales": fecha → `AAAA-MM-DD` o `null`, renglones → `[{ materialId, cantidad }]`, sin `clienteId` al editar); verificar que fallan
- [ ] 4.2 Escribir `core/api/encargos.api.spec.ts` (listar con `estado` y `clienteId`, crear, actualizar, eliminar y `PUT /api/encargos/:id/{confirmar|cancelar|iniciar|entregar}`; escenarios "Filtro por estado" y "Confirmación exitosa") y sumar a `traducirError.spec.ts` el caso `STOCK_INSUFICIENTE` ("Confirmación sin stock": una línea por material con requerido y disponible); verificar que fallan
- [ ] 4.3 Implementar `dominio/encargos.ts` (D4, D7), `core/api/encargos.api.ts` y el caso `STOCK_INSUFICIENTE` en `traducirError.ts`; verificar que los tests de 4.1 y 4.2 pasan
- [ ] 4.4 Crear `features/encargos/` con tabla (filtros por estado y cliente, `p-tag` por estado, botones según `accionesDisponibles`), diálogo de alta/edición (cliente con `p-select`, deshabilitado al editar; `p-datepicker`; renglones de material y cantidad que impiden repetir material) y confirmación para eliminar y cancelar; verificar a mano "Alta con materiales", "Material repetido en el formulario", "Confirmación exitosa" (stock descontado en Materiales), "Confirmación sin stock", cancelar un confirmado con reposición y el recorrido completo hasta `entregado`. Commit: `web/src/app/dominio/encargos*.ts`, `web/src/app/core/api/encargos.api*.ts`, `web/src/app/core/errores/`, `web/src/app/features/encargos/`, `web/src/app/app.routes.ts`

## 5. CI, reglas y documentación

- [ ] 5.1 Agregar a `.github/workflows/ci.yml` el job `web` (D10: `working-directory: web`, caché por `web/package-lock.json`, `npm ci`, `npm test`, `npm run build`); verificar localmente con `npm --prefix web ci && npm --prefix web test && npm --prefix web run build`
- [ ] 5.2 Agregar a `AGENTS.md` la sección "Front (`web/`)" (D10) y actualizar `README.md`: requisitos de Node, `npm run setup`, `npm run dev:all`, URLs (`:4200` UI, `:3000` API, `/api-docs`), proxy `/api` y cómo correr los tests del front; verificar siguiendo el README desde cero que todo levanta
- [ ] 5.3 Verificación integral: con `npm run dev:all` recorrer clientes → materiales → encargos (alta, confirmar con aviso en consola de la API, stock bajo, stock insuficiente, cancelación con reposición, bajas bloqueadas) en modo `memory` y `sequelize`; confirmar `npm test` en la raíz, `npm --prefix web test` y `openspec validate --all --strict` en verde. Commit: `.github/workflows/ci.yml`, `AGENTS.md`, `README.md`, `openspec/changes/interfaz-web/`

## Workflow follow-up

- Archivar el change como último commit del PR (`/opsx:archive`) y redactar la descripción del PR con `.github/pull_request_template.md`.
- Mergear sin squash.
