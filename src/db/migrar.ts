// Aplica las migraciones pendientes y crea los datos iniciales.
// Es seguro ejecutarlo varias veces. Lo llama src/instrumentation.ts al
// arrancar el servidor y `npm run db:migrate` desde la terminal.
import { existsSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql, { type RowDataPacket } from "mysql2/promise";

export const CONSUMIDOR_FINAL = "Consumidor final";

export async function migrar(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable DATABASE_URL");

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!existsSync(migrationsFolder)) {
    throw new Error(`No se encontró la carpeta de migraciones en ${migrationsFolder}`);
  }

  const conn = await mysql.createConnection({ uri: url, timezone: "Z" });
  try {
    await migrate(drizzle(conn), { migrationsFolder });
    console.log("[migrar] Migraciones aplicadas");

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
      "SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1",
    );
    const usuario = process.env.SEED_ADMIN_USUARIO;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (admins.length === 0 && usuario && password) {
      await conn.query(
        "INSERT INTO usuarios (nombre_usuario, password_hash, nombre, rol) VALUES (?, ?, ?, 'admin')",
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
