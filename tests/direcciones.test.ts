import { describe, expect, it } from "vitest";
import { validarDirecciones } from "@/app/admin/clientes/datos";

const base = {
  alias: "",
  calleNumero: "San Martín 123",
  barrio: "",
  localidad: "Rosario",
  provincia: "Santa Fe",
  referencias: "",
  esPrincipal: false,
};

describe("validarDirecciones", () => {
  it("acepta ninguna dirección", () => {
    expect(validarDirecciones("[]")).toEqual({ ok: true, direcciones: [] });
  });

  it("vacía los opcionales y deja una sola principal", () => {
    const r = validarDirecciones(JSON.stringify([base, { ...base, esPrincipal: true }, { ...base, esPrincipal: true }]));
    expect(r.ok && r.direcciones.map((d) => d.esPrincipal)).toEqual([false, true, false]);
    expect(r.ok && r.direcciones[0].alias).toBeNull();
  });

  it("exige calle, localidad y provincia", () => {
    expect(validarDirecciones(JSON.stringify([{ ...base, localidad: " " }]))).toEqual({
      ok: false,
      error: "Dirección 1: Falta la localidad",
    });
  });
});
