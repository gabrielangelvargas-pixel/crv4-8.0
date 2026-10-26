import { describe, expect, it } from "vitest";
import { leerRenglones } from "@/lib/checkout";

describe("leerRenglones", () => {
  it("une renglones repetidos de la misma variante", () => {
    expect(
      leerRenglones(JSON.stringify([{ varianteId: 3, cantidad: 2 }, { varianteId: 5, cantidad: 1 }, { varianteId: 3, cantidad: 4 }])),
    ).toEqual([
      { varianteId: 3, cantidad: 6 },
      { varianteId: 5, cantidad: 1 },
    ]);
  });

  it("rechaza vacío, cantidades no enteras o fuera de rango y JSON roto", () => {
    expect(leerRenglones("[]")).toBeNull();
    expect(leerRenglones("no")).toBeNull();
    expect(leerRenglones(JSON.stringify([{ varianteId: 1, cantidad: 1.5 }]))).toBeNull();
    expect(leerRenglones(JSON.stringify([{ varianteId: 1, cantidad: 0 }]))).toBeNull();
    expect(leerRenglones(JSON.stringify([{ varianteId: -1, cantidad: 1 }]))).toBeNull();
  });

  it("no pasa del máximo por renglón", () => {
    expect(leerRenglones(JSON.stringify([{ varianteId: 1, cantidad: 9999 }, { varianteId: 1, cantidad: 5 }]))).toEqual([
      { varianteId: 1, cantidad: 9999 },
    ]);
  });
});
