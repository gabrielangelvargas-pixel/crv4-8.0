import { describe, expect, it } from "vitest";
import { datosAviso, datosFranja } from "@/app/admin/portada/promociones-datos";
import { avisoVigente, frasesDeTexto, hoyEnArgentina } from "@/lib/promociones";
import { rutaValida } from "@/lib/rutas-imagen";

const aviso = { titulo: "Ofertas", texto: null, botonTexto: null, enlace: null, desde: null, hasta: null, frecuencia: "dia", activo: true };

describe("franja de texto", () => {
  it("toma una frase por renglón y descarta los vacíos", () => {
    expect(frasesDeTexto(" Bijou \n\nMarroquinería\r\nAccesorios ")).toEqual(["Bijou", "Marroquinería", "Accesorios"]);
  });

  it("limpia las frases y pide al menos una para mostrarla", () => {
    const franja = { frases: "Uno\n\n Dos ", icono: "corazon", colorFondo: "#f2687a", colorTexto: "#ffffff", activo: true };
    expect(datosFranja.parse(franja).frases).toBe("Uno\nDos");
    expect(datosFranja.safeParse({ ...franja, frases: " \n " }).success).toBe(false);
    expect(datosFranja.safeParse({ ...franja, frases: "", activo: false }).success).toBe(true);
    expect(datosFranja.safeParse({ ...franja, colorFondo: "rojo" }).success).toBe(false);
  });
});

describe("aviso emergente", () => {
  it("valida fechas, enlace y botón", () => {
    expect(datosAviso.safeParse(aviso).success).toBe(true);
    expect(datosAviso.safeParse({ ...aviso, desde: "2026-11-10", hasta: "2026-11-01" }).success).toBe(false);
    expect(datosAviso.safeParse({ ...aviso, botonTexto: "Ver" }).success).toBe(false);
    expect(datosAviso.safeParse({ ...aviso, botonTexto: "Ver", enlace: "/catalogo" }).success).toBe(true);
    expect(datosAviso.safeParse({ ...aviso, enlace: "javascript:alert(1)" }).success).toBe(false);
  });

  it("se muestra solo entre las fechas elegidas", () => {
    expect(avisoVigente(null, null, "2026-10-23")).toBe(true);
    expect(avisoVigente("2026-10-23", "2026-10-23", "2026-10-23")).toBe(true);
    expect(avisoVigente("2026-10-24", null, "2026-10-23")).toBe(false);
    expect(avisoVigente(null, "2026-10-22", "2026-10-23")).toBe(false);
  });

  it("usa la fecha de Argentina", () => {
    expect(hoyEnArgentina(new Date("2026-10-24T02:00:00Z"))).toBe("2026-10-23");
  });

  it("acepta la ruta de su imagen", () => {
    expect(rutaValida("portadas/lq3x9k2a-aviso.webp")).toBe(true);
  });
});
