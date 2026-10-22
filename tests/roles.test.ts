import { describe, expect, it } from "vitest";
import { destinoSeguro, duracionSesionMs, inicioSegunRol, puedeEntrarAGestion } from "@/lib/auth/roles";
import { menuPara } from "@/app/admin/menu";

describe("roles", () => {
  it("solo admin y vendedor entran a gestión", () => {
    expect(puedeEntrarAGestion("admin")).toBe(true);
    expect(puedeEntrarAGestion("vendedor")).toBe(true);
    expect(puedeEntrarAGestion("cliente")).toBe(false);
  });

  it("cada rol tiene su página de inicio", () => {
    expect(inicioSegunRol("admin")).toBe("/admin");
    expect(inicioSegunRol("cliente")).toBe("/cuenta");
  });

  it("la sesión del cliente dura más que la del personal", () => {
    expect(duracionSesionMs("cliente")).toBeGreaterThan(duracionSesionMs("vendedor"));
  });

  it("el vendedor no ve stock, rubros ni usuarios", () => {
    const rutas = menuPara("vendedor").map((i) => i.href);
    expect(rutas).not.toContain("/admin/stock");
    expect(rutas).not.toContain("/admin/rubros");
    expect(rutas).not.toContain("/admin/usuarios");
    expect(menuPara("admin").map((i) => i.href)).toContain("/admin/stock");
  });
});

describe("destinoSeguro", () => {
  it("acepta rutas internas", () => {
    expect(destinoSeguro("/admin/pedidos")).toBe("/admin/pedidos");
  });

  it("rechaza destinos externos o inválidos", () => {
    expect(destinoSeguro("https://malo.com")).toBeNull();
    expect(destinoSeguro("//malo.com")).toBeNull();
    expect(destinoSeguro("/\\malo.com")).toBeNull();
    expect(destinoSeguro(undefined)).toBeNull();
  });
});
