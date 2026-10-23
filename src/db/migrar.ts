// Aplica las migraciones pendientes y crea los datos iniciales.
// Es seguro ejecutarlo varias veces. Lo llama src/instrumentation.ts al
// arrancar el servidor y `npm run db:migrate` desde la terminal.
import bcrypt from "bcryptjs";
import type { MigrationMeta } from "drizzle-orm/migrator";
import mysql, { type RowDataPacket } from "mysql2/promise";
// Generado desde drizzle/ por scripts/empaquetar-migraciones.mjs.
import migracionesJson from "./migraciones.json";

const migraciones = migracionesJson as MigrationMeta[];

export const CONSUMIDOR_FINAL = "Consumidor final";

// Misma lógica y misma tabla (__drizzle_migrations) que migrate() de drizzle,
// pero leyendo las migraciones empaquetadas en vez de la carpeta drizzle/.
async function aplicarMigraciones(conn: mysql.Connection): Promise<void> {
  await conn.query(
    "CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (id serial primary key, hash text not null, created_at bigint)",
  );
  const [filas] = await conn.query<RowDataPacket[]>(
    "SELECT created_at FROM `__drizzle_migrations` ORDER BY created_at DESC LIMIT 1",
  );
  const ultima = filas.length > 0 ? Number(filas[0].created_at) : -1;

  for (const migracion of migraciones) {
    if (migracion.folderMillis <= ultima) continue;
    for (const sentencia of migracion.sql) {
      if (sentencia.trim()) await conn.query(sentencia);
    }
    await conn.query("INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)", [
      migracion.hash,
      migracion.folderMillis,
    ]);
    console.log(`[migrar] Migración ${migracion.folderMillis} aplicada`);
  }
}

export async function migrar(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable DATABASE_URL");

  const conn = await mysql.createConnection({ uri: url, timezone: "Z", charset: "utf8mb4" });
  try {
    await aplicarMigraciones(conn);
    console.log("[migrar] Base de datos al día");

    const [clientes] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM clientes WHERE nombre = ? LIMIT 1",
      [CONSUMIDOR_FINAL],
    );
    if (clientes.length === 0) {
      await conn.query(
        "INSERT INTO clientes (nombre, telefono, origen) VALUES (?, ?, 'presencial')",
        [CONSUMIDOR_FINAL, "-"],
      );
      console.log(`[migrar] Cliente "${CONSUMIDOR_FINAL}" creado`);
    }

    const [admins] = await conn.query<RowDataPacket[]>(
      "SELECT u.id FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE r.codigo = 'admin' LIMIT 1",
    );
    const usuario = process.env.SEED_ADMIN_USUARIO;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (admins.length === 0 && usuario && password) {
      await conn.query(
        "INSERT INTO usuarios (nombre_usuario, password_hash, nombre, rol_id) SELECT ?, ?, ?, id FROM roles WHERE codigo = 'admin'",
        [usuario, await bcrypt.hash(password, 12), "Administrador"],
      );
      console.log(`[migrar] Administrador "${usuario}" creado`);
    } else if (admins.length === 0) {
      console.warn("[migrar] No hay administrador: define SEED_ADMIN_USUARIO y SEED_ADMIN_PASSWORD");
    }
  } finally {
    await conn.end();
  }
}
