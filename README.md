# CRV4

App única para gestionar rubros, productos, clientes, pedidos web, ventas presenciales y stock, con:

- **Zona pública**: catálogo, carrito y pedidos (paso 3 del plan).
- **Zona de gestión** (`/admin`): según el rol del usuario (`admin` o `vendedor`).
- **Mi cuenta** (`/cuenta`): para usuarios con rol `cliente`.

El diseño de datos está en [docs/entidades.md](docs/entidades.md).

## Tecnologías

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | una sola app para la web pública y la gestión, con páginas renderizadas en el servidor |
| Base de datos | MySQL / MariaDB | la que ofrece Hostinger |
| Acceso a datos | Drizzle ORM + mysql2 | esquema tipado en `src/db/schema.ts` y migraciones SQL versionadas en `drizzle/` |
| Estilos | Tailwind CSS 4 (vía PostCSS) | |
| Validación | Zod | |
| Login | sesiones propias en la tabla `sesiones` + cookie httpOnly; contraseñas con bcrypt | |
| Tests | Vitest | |

## Estructura

```
src/
  app/            páginas (pública, /login, /admin, /cuenta)
  components/     componentes compartidos
  db/             schema.ts (tablas) e index.ts (conexión)
  lib/auth/       sesiones, contraseñas, roles y requerirRol()
  proxy.ts        redirige a /login si no hay sesión en zonas privadas
drizzle/          migraciones SQL generadas
src/db/migrar.ts     aplica migraciones y crea datos iniciales (al arrancar)
src/db/migraciones.json  copia de drizzle/ que viaja en el build (generada)
docs/             diseño de entidades
tests/            tests unitarios
```

## Uso en local

Requisitos: Node.js 20.9 o superior y un MySQL/MariaDB.

```bash
cp .env.example .env      # y completa DATABASE_URL y el admin inicial
npm install
npm run db:migrate        # crea las tablas, el admin y "Consumidor final"
npm run dev               # http://localhost:3000
```

Comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm run db:generate` | genera una migración nueva tras cambiar `src/db/schema.ts` |
| `npm run db:migrate` | aplica migraciones pendientes y datos iniciales |
| `npm run typecheck` / `npm run lint` / `npm test` | controles de calidad |

## Seguridad y roles

- Toda página o acción privada llama a `requerirRol(...)` (`src/lib/auth/dal.ts`); el `proxy.ts` es solo un primer filtro.
- La cookie guarda un token aleatorio; la base guarda solo su hash SHA-256.
- Sesión de clientes: 1 año (queda logueado). Sesión de admin y vendedor: 7 días.
- El vendedor no ve rubros, proveedores, stock ni usuarios (`src/app/admin/menu.ts`).

## Despliegue en Hostinger

El sitio se despliega solo desde la rama `main` de GitHub.

1. En hPanel, crea la base de datos MySQL y un usuario con contraseña segura.
2. En la app Node.js conectada a este repositorio usa Node 22 (también compila con Node 20), comando de build `npm run build` y de inicio `npm start`.
3. Carga las variables de entorno de `.env.example` (`DATABASE_URL`, `SEED_ADMIN_USUARIO`, `SEED_ADMIN_PASSWORD`). Nunca subas `.env` al repositorio.
4. Al arrancar, la app ejecuta `src/db/migrar.ts` (desde `src/instrumentation.ts`), que aplica las migraciones nuevas. Si falla, el error aparece en el log del servidor con el prefijo `[migrar]`. El admin inicial se crea solo si todavía no hay ninguno.
5. Tras el primer ingreso, cambia la contraseña del admin inicial.
