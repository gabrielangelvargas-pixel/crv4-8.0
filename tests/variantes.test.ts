import { describe, expect, it } from "vitest";
import { validarVariantes, type VarianteFormulario } from "@/app/admin/productos/datos";

const base: VarianteFormulario = {
  valor: "",
  codigo: "abc123",
  codigoProveedor: "",
  precioCosto: "",
  precioVenta: "1.500,50",
  precioOferta: "",
  activo: true,
  esPrincipal: false,
};

const json = (...v: Partial<VarianteFormulario>[]) => JSON.stringify(v.map((x) => ({ ...base, ...x })));

describe("validarVariantes", () => {
  it("un producto sin variantes queda con una sola, Única y principal", () => {
    const r = validarVariantes(json({}), "ninguna");
    expect(r).toMatchObject({
      ok: true,
      variantes: [{ valor: "Única", codigo: "ABC123", precioVenta: "1500.50", precioCosto: "0.00", esPrincipal: true }],
    });
  });

  it("rechaza más de una variante si el producto no tiene variantes", () => {
    expect(validarVariantes(json({}, { codigo: "B" }), "ninguna").ok).toBe(false);
  });

  it("exige nombre, códigos y nombres distintos", () => {
    expect(validarVariantes(json({ valor: "" }), "color")).toMatchObject({ ok: false });
    expect(validarVariantes(json({ valor: "Rojo" }, { valor: "Azul" }), "color")).toMatchObject({
      ok: false,
      error: "El código ABC123 está repetido",
    });
    expect(validarVariantes(json({ valor: "Rojo" }, { valor: "rojo", codigo: "X" }), "color").ok).toBe(false);
  });

  it("valida código y oferta", () => {
    expect(validarVariantes(json({ codigo: "12345678901234" }), "ninguna").ok).toBe(false);
    expect(validarVariantes(json({ precioOferta: "2000" }), "ninguna").ok).toBe(false);
    expect(validarVariantes(json({ precioOferta: "1000" }), "ninguna")).toMatchObject({
      ok: true,
      variantes: [{ precioOferta: "1000.00" }],
    });
  });

  it("deja exactamente una principal", () => {
    const r = validarVariantes(
      json({ valor: "Cartón", codigo: "A", esPrincipal: true }, { valor: "Blister", codigo: "B", esPrincipal: true }),
      "presentacion",
    );
    expect(r.ok && r.variantes.map((v) => v.esPrincipal)).toEqual([true, false]);
  });
});
