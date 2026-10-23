import { describe, expect, it } from "vitest";
import { slugificar, textoOpcional } from "@/lib/texto";

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
