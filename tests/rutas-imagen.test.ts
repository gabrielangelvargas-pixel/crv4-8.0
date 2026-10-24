import { describe, expect, it } from "vitest";
import { rutaFotoPortada, rutaFotoProducto, rutaFotoRubro, rutaValida } from "@/lib/rutas-imagen";

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

describe("rutas de la portada", () => {
  it("arma y acepta las rutas de escritorio y celular", () => {
    expect(rutaFotoPortada("escritorio", "lq3x9k2a")).toBe("portadas/lq3x9k2a-escritorio.webp");
    expect(rutaValida("portadas/lq3x9k2a-movil.webp")).toBe(true);
    expect(rutaValida("portadas/lq3x9k2a-tablet.webp")).toBe(false);
    expect(rutaValida("portadas/../x-movil.webp")).toBe(false);
  });
});

describe("rutas de los rubros", () => {
  it("arma y acepta la ruta de la imagen del rubro", () => {
    expect(rutaFotoRubro("lq3x9k2a")).toBe("rubros/lq3x9k2a.webp");
    expect(rutaValida("rubros/lq3x9k2a.webp")).toBe(true);
    expect(rutaValida("rubros/../x.webp")).toBe(false);
    expect(rutaValida("rubros/Vasos.webp")).toBe(false);
  });
});
