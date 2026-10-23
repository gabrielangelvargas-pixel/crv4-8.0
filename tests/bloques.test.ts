import { describe, expect, it } from "vitest";
import { validarBloques } from "@/app/admin/portada/bloques-datos";

describe("bloques de la portada", () => {
  it("acepta una lista válida y limpia los espacios", () => {
    const r = validarBloques(JSON.stringify([{ icono: "camion", titulo: " Envíos ", texto: "A todo el país", activo: true }]));
    expect(r).toEqual({ ok: true, bloques: [{ icono: "camion", titulo: "Envíos", texto: "A todo el país", activo: true }] });
  });

  it("rechaza íconos desconocidos, títulos vacíos y listas largas", () => {
    expect(validarBloques(JSON.stringify([{ icono: "cohete", titulo: "X", texto: "", activo: true }])).ok).toBe(false);
    expect(validarBloques(JSON.stringify([{ icono: "camion", titulo: "  ", texto: "", activo: true }]))).toEqual({
      ok: false,
      error: "Cada bloque necesita un título",
    });
    const muchos = Array.from({ length: 9 }, () => ({ icono: "camion", titulo: "X", texto: "", activo: true }));
    expect(validarBloques(JSON.stringify(muchos)).ok).toBe(false);
    expect(validarBloques("no es json").ok).toBe(false);
  });
});
