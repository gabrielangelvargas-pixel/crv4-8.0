import { describe, expect, it } from "vitest";
import { rutaFotoProducto, rutaValida } from "@/lib/rutas-imagen";

describe("rutas de imágenes", () => {
  it("arma la ruta con el rubro y el código", () => {
    expect(rutaFotoProducto("vasos-termicos", "02101010")).toBe("productos/vasos-termicos/02101010.webp");
  });

  it("acepta las rutas por rubro y las fotos viejas en la raíz", () => {
    expect(rutaValida("productos/vasos-termicos/02101420-149.webp")).toBe(true);
    expect(rutaValida("02101420-149.webp")).toBe(true);
  });

  it("rechaza rutas que salen de la carpeta o no son fotos", () => {
    for (const ruta of [
      "../secreto.webp",
      "productos/../02101010.webp",
      "productos/vasos/../../x.webp",
      "productos//02101010.webp",
      "otra/vasos/02101010.webp",
      "productos/vasos/02101010.png",
      "productos/Vasos/02101010.webp",
    ]) {
      expect(rutaValida(ruta), ruta).toBe(false);
    }
  });
});
