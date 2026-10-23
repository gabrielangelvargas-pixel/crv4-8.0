import { describe, expect, it } from "vitest";
import { normalizarTelefono, slugificar, textoOpcional } from "@/lib/texto";

describe("slugificar", () => {
  it("quita acentos, mayúsculas y símbolos", () => {
    expect(slugificar("Bebidas sin Alcohol")).toBe("bebidas-sin-alcohol");
    expect(slugificar("  Lácteos & Fiambres! ")).toBe("lacteos-fiambres");
    expect(slugificar("Niño/Ñandú")).toBe("nino-nandu");
  });
});

describe("textoOpcional", () => {
  it("convierte vacío en null y recorta espacios", () => {
    expect(textoOpcional("  ")).toBeNull();
    expect(textoOpcional(null)).toBeNull();
    expect(textoOpcional(" hola ")).toBe("hola");
  });
});

describe("normalizarTelefono", () => {
  it("quita espacios y separadores", () => {
    expect(normalizarTelefono("(011) 15-4567-8901")).toBe("0111545678901");
    expect(normalizarTelefono("+54 9 351 555.1234")).toBe("+5493515551234");
  });
  it("rechaza lo que no es un teléfono", () => {
    expect(normalizarTelefono("abc")).toBeNull();
    expect(normalizarTelefono("123")).toBeNull();
    expect(normalizarTelefono("-")).toBeNull();
  });
});
