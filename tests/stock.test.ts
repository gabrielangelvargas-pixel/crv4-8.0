import { describe, expect, it } from "vitest";
import { calcularMovimiento } from "@/app/admin/stock/datos";

describe("calcularMovimiento", () => {
  it("un ingreso suma", () => {
    expect(calcularMovimiento("ingreso", "10.000", "2,5")).toEqual({ ok: true, cantidad: "2.500", stockNuevo: "12.500" });
    expect(calcularMovimiento("ingreso", "0.100", "0,2")).toEqual({ ok: true, cantidad: "0.200", stockNuevo: "0.300" });
  });

  it("un ingreso tiene que ser positivo", () => {
    expect(calcularMovimiento("ingreso", "10", "0").ok).toBe(false);
    expect(calcularMovimiento("ingreso", "10", "abc").ok).toBe(false);
  });

  it("un ajuste deja el stock contado y registra la diferencia", () => {
    expect(calcularMovimiento("ajuste", "10.000", "7")).toEqual({ ok: true, cantidad: "-3.000", stockNuevo: "7.000" });
    expect(calcularMovimiento("ajuste", "-2.000", "0")).toEqual({ ok: true, cantidad: "2.000", stockNuevo: "0.000" });
    expect(calcularMovimiento("ajuste", "5", "5").ok).toBe(false);
  });
});
