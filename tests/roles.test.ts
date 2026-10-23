import { describe, expect, it } from "vitest";
import { menuPara } from "@/app/admin/menu";
import { tienePermiso, type PerfilAcceso } from "@/lib/auth/permisos";
import { destinoSeguro, duracionSesionMs, inicioSegun } from "@/lib/auth/roles";

const admin: PerfilAcceso = { accesoTotal: true, accesoGestion: true, permisos: [] };
const vendedor: PerfilAcceso = {
  accesoTotal: false,
  accesoGestion: true,
  permisos: ["productos:ver", "pedidos:ver", "pedidos:crear", "pedidos:editar"],
};
const cliente: PerfilAcceso = { accesoTotal: false, accesoGestion: false, permisos: ["productos:ver"] };

describe("permisos", () => {
  it("el administrador puede todo", () => {
    expect(tienePermiso(admin, "proveedores", "eliminar")).toBe(true);
    expect(tienePermiso(admin, "roles", "editar")).toBe(true);
  });

  it("el vendedor solo tiene lo asignado", () => {
    expect(tienePermiso(vendedor, "productos", "ver")).toBe(true);
    expect(tienePermiso(vendedor, "productos", "editar")).toBe(false);
    expect(tienePermiso(vendedor, "pedidos", "editar")).toBe(true);
    expect(tienePermiso(vendedor, "pedidos", "eliminar")).toBe(false);
    expect(tienePermiso(vendedor, "proveedores", "ver")).toBe(false);
  });

  it("un rol sin acceso a gestión no tiene permisos aunque estén cargados", () => {
    expect(tienePermiso(cliente, "productos", "ver")).toBe(false);
  });

  it("el menú muestra solo los módulos que el rol puede ver", () => {
    const rutas = menuPara(vendedor).map((i) => i.href);
    expect(rutas).toEqual(["/admin", "/admin/pedidos", "/admin/productos"]);
    expect(menuPara(admin).map((i) => i.href)).toContain("/admin/roles");
  });
});

describe("sesión", () => {
  it("cada perfil tiene su página de inicio", () => {
    expect(inicioSegun(true)).toBe("/admin");
    expect(inicioSegun(false)).toBe("/cuenta");
  });

  it("la sesión del cliente dura más que la del personal", () => {
    expect(duracionSesionMs(false)).toBeGreaterThan(duracionSesionMs(true));
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
