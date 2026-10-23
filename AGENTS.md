<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proyecto CRV4

- Idioma del código de dominio y la interfaz: español (tablas, columnas, rutas, textos).
- Diseño de datos: `docs/entidades.md`. Si cambias `src/db/schema.ts`, actualiza ese documento y genera la migración con `npm run db:generate` (también regenera `src/db/migraciones.json`, que se commitea: Hostinger publica solo el build, sin la carpeta `drizzle/`).
- Toda página o Server Action de gestión debe llamar a `requerirPermiso(modulo, accion)` (o `requerirGestion()` / `requerirCliente()`) de `src/lib/auth/dal.ts`. El catálogo de módulos y acciones está en `src/lib/auth/permisos-catalogo.ts`; qué rol tiene cada uno se guarda en `rol_permisos`.
- `cacheComponents` está desactivado a propósito para mantener el modelo de renderizado simple.
- Se compila con Webpack (`next build --webpack`): Turbopack falla en el build de Hostinger al procesar el CSS.
- Antes de subir cambios: `npm run typecheck && npm run lint && npm test && npm run build`.
