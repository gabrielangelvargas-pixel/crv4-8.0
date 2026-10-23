import { describe, expect, it } from "vitest";
import { importeParaCampo, leerDecimal } from "@/lib/numeros";

describe("leerDecimal", () => {
  it("entiende los formatos habituales", () => {
    expect(leerDecimal("1.234,50")).toBe("1234.50");
    expect(leerDecimal("1234,5")).toBe("1234.50");
    expect(leerDecimal("1234.5")).toBe("1234.50");
    expect(leerDecimal("$ 1.234")).toBe("1234.00");
    expect(leerDecimal("12.345.678")).toBe("12345678.00");
    expect(leerDecimal("0")).toBe("0.00");
    expect(leerDecimal("2,5", 3)).toBe("2.500");
  });

  it("rechaza lo que no es un número positivo", () => {
    expect(leerDecimal("")).toBeNull();
    expect(leerDecimal("abc")).toBeNull();
    expect(leerDecimal("-5")).toBeNull();
    expect(leerDecimal("1,2,3")).toBeNull();
  });

  it("vuelve al formato del campo", () => {
    expect(importeParaCampo("1234.50")).toBe("1234,50");
    expect(importeParaCampo(null)).toBe("");
  });
});
