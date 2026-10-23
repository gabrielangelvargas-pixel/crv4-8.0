import { describe, expect, it } from "vitest";
import { errorNombreUsuario, errorPassword } from "@/lib/auth/validacion";

describe("errorNombreUsuario", () => {
  it("acepta nombres y teléfonos", () => {
    expect(errorNombreUsuario("juan.perez")).toBeNull();
    expect(errorNombreUsuario("+5493415551234")).toBeNull();
  });
  it("rechaza cortos o con espacios", () => {
    expect(errorNombreUsuario("ab")).not.toBeNull();
    expect(errorNombreUsuario("juan perez")).not.toBeNull();
  });
});

describe("errorPassword", () => {
  it("pide largo mínimo y que coincidan", () => {
    expect(errorPassword("corta", "corta")).toMatch(/al menos 8/);
    expect(errorPassword("larga-segura", "otra-cosa")).toBe("Las contraseñas no coinciden");
    expect(errorPassword("larga-segura", "larga-segura")).toBeNull();
  });
});
