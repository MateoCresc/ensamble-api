## Change de OpenSpec

<!-- Nombre del change y link a su carpeta archivada, p. ej. openspec/changes/archive/AAAA-MM-DD-clientes/ -->
- Change:

## Qué agrega

<!-- 2 a 5 bullets con el comportamiento nuevo, en términos de la spec (no del código) -->
-

## Requisitos de la consigna que cubre

<!-- p. ej. 2.2 CRUD y regla de negocio · 2.7 Swagger -->
-

## Decisiones de diseño

<!-- Las más relevantes del design.md, con su porqué en una línea -->
-

## Cómo probarlo

```bash
npm install
npm test
npm run dev   # y abrir http://localhost:3000/api-docs
```

<!-- Pedidos concretos de requests.http o pasos en Swagger UI -->

## Checklist

- [ ] Todas las tareas de `tasks.md` tildadas
- [ ] Change archivado como último commit (`/opsx:archive`)
- [ ] `npm test` en verde
- [ ] `openspec validate --all --strict` sin errores
- [ ] Endpoints nuevos documentados en `docs/openapi.yaml` y en `requests.http`
- [ ] Sin `.env`, `node_modules/`, `*.sqlite` ni `coverage/` en el diff
