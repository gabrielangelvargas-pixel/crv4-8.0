import { describe, expect, it } from "vitest";
import { validarBloques } from "@/app/admin/portada/bloques-datos";
import { lineasDeTexto } from "@/lib/iconos-bloque";

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

  it("corta el texto en líneas con Enter o <br>", () => {
    expect(lineasDeTexto("Mínimo de inversión <br>$70.000.")).toEqual(["Mínimo de inversión", "$70.000."]);
    expect(lineasDeTexto("Uno<BR/>Dos\nTres")).toEqual(["Uno", "Dos", "Tres"]);
    expect(lineasDeTexto("Solo una")).toEqual(["Solo una"]);
  });
});
