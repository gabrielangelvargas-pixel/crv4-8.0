// Copia las migraciones de drizzle/ a src/db/migraciones.json para que viajen
// dentro del bundle: Hostinger publica solo el build y no la carpeta drizzle/.
// Se ejecuta en `npm run build` y en `npm run db:generate`.
import { writeFileSync } from "node:fs";
import { readMigrationFiles } from "drizzle-orm/migrator";

const migraciones = readMigrationFiles({ migrationsFolder: "./drizzle" });
writeFileSync("src/db/migraciones.json", JSON.stringify(migraciones, null, 2) + "\n");
console.log(`[migraciones] ${migraciones.length} empaquetada(s) en src/db/migraciones.json`);
