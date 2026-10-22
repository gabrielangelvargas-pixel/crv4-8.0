// Aplica las migraciones pendientes y crea los datos iniciales.
// Se ejecuta antes de `next start` (ver "prestart" en package.json), así
// cada despliegue en Hostinger deja la base al día sin pasos manuales.
// Es seguro ejecutarlo varias veces.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const CONSUMIDOR_FINAL = "Consumidor final";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta la variable DATABASE_URL");
  process.exit(1);
}

const conn = await mysql.createConnection({ uri: url, timezone: "Z" });
try {
  await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
  console.log("Migraciones aplicadas");

  const [clientes] = await conn.query(
    "SELECT id FROM clientes WHERE nombre = ? LIMIT 1",
    [CONSUMIDOR_FINAL],
  );
  if (clientes.length === 0) {
    await conn.query(
      "INSERT INTO clientes (nombre, telefono, origen) VALUES (?, ?, 'presencial')",
      [CONSUMIDOR_FINAL, "-"],
    );
    console.log(`Cliente "${CONSUMIDOR_FINAL}" creado`);
  }

  const [admins] = await conn.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
  const usuario = process.env.SEED_ADMIN_USUARIO;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (admins.length === 0 && usuario && password) {
    await conn.query(
      "INSERT INTO usuarios (nombre_usuario, password_hash, nombre, rol) VALUES (?, ?, ?, 'admin')",
      [usuario, await bcrypt.hash(password, 12), "Administrador"],
    );
    console.log(`Administrador "${usuario}" creado`);
  } else if (admins.length === 0) {
    console.warn("No hay administrador: define SEED_ADMIN_USUARIO y SEED_ADMIN_PASSWORD");
  }
} finally {
  await conn.end();
}
