import { describe, expect, it } from "vitest";
import { calcularTotales, estadosSiguientes, subtotalDe } from "@/lib/pedidos";

describe("calcularTotales", () => {
  it("suma subtotales de venta y costo y el adicional", () => {
    const r = calcularTotales(
      [
        { cantidad: "3", precioUnitario: "2500.00", precioCosto: "1800.50" },
        { cantidad: "0.5", precioUnitario: "999.99", precioCosto: "0" },
      ],
      "1500",
    );
    expect(r.items.map((i) => i.subtotal)).toEqual(["7500.00", "500.00"]);
    expect(r.subtotal).toBe("8000.00");
    expect(r.subtotalCosto).toBe("5401.50");
    expect(r.total).toBe("9500.00");
  });

  it("no arrastra errores de coma flotante", () => {
    expect(subtotalDe("3", "0.10")).toBe("0.30");
    expect(calcularTotales([{ cantidad: "1", precioUnitario: "0.1", precioCosto: "0" }, { cantidad: "1", precioUnitario: "0.2", precioCosto: "0" }], "0").total).toBe("0.30");
  });
});

describe("estadosSiguientes", () => {
  it("avanza o cancela", () => {
    expect(estadosSiguientes("pendiente")).toEqual(["confirmado", "preparado", "listo_o_enviado", "entregado", "cancelado"]);
    expect(estadosSiguientes("listo_o_enviado")).toEqual(["entregado", "cancelado"]);
    expect(estadosSiguientes("entregado")).toEqual(["cancelado"]);
    expect(estadosSiguientes("cancelado")).toEqual([]);
  });
});
