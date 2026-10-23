import { readMigrationFiles } from "drizzle-orm/migrator";
import { describe, expect, it } from "vitest";
import migraciones from "@/db/migraciones.json";

describe("migraciones empaquetadas", () => {
  it("coinciden con la carpeta drizzle/", () => {
    const actuales = readMigrationFiles({ migrationsFolder: "./drizzle" });
    expect(migraciones).toEqual(JSON.parse(JSON.stringify(actuales)));
  });
});
