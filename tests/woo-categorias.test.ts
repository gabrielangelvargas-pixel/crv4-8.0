import { describe, expect, it } from "vitest";
import { decodificarHtml, normalizarTienda, prepararCategorias, type CategoriaWoo } from "@/lib/woo-categorias";

describe("normalizarTienda", () => {
  it("agrega https y quita la barra final", () => {
    expect(normalizarTienda("mitienda.com/")).toBe("https://mitienda.com");
    expect(normalizarTienda(" https://mitienda.com/shop/ ")).toBe("https://mitienda.com/shop");
  });
  it("rechaza http y direcciones raras", () => {
    expect(normalizarTienda("http://mitienda.com")).toBeNull();
    expect(normalizarTienda("localhost")).toBeNull();
    expect(normalizarTienda("https://usuario:clave@mitienda.com")).toBeNull();
    expect(normalizarTienda("")).toBeNull();
  });
});

describe("decodificarHtml", () => {
  it("decodifica entidades con nombre y numéricas", () => {
    expect(decodificarHtml("Plata &amp; Acero &#8211; 925 &#x2F; Aros")).toBe("Plata & Acero – 925 / Aros");
    expect(decodificarHtml("&raro; sigue")).toBe("&raro; sigue");
  });
});

describe("prepararCategorias", () => {
  const cat = (id: number, name: string, parent = 0, extra: Partial<CategoriaWoo> = {}): CategoriaWoo => ({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    parent,
    ...extra,
  });

  it("ordena principales por menu_order y pone sus subcategorías debajo", () => {
    const lista = prepararCategorias([
      cat(1, "Plata", 0, { menu_order: 2 }),
      cat(2, "Acero", 0, { menu_order: 1 }),
      cat(3, "Aros plata", 1),
      cat(4, "Anillos acero", 2),
    ]);
    expect(lista.map((c) => [c.nombre, c.principalWooId])).toEqual([
      ["Acero", null],
      ["Anillos acero", 2],
      ["Plata", null],
      ["Aros plata", 1],
    ]);
  });

  it("aplana un tercer nivel bajo la principal y recuerda dónde estaba", () => {
    const lista = prepararCategorias([cat(1, "Plata"), cat(2, "Aros", 1), cat(3, "Aros argolla", 2)]);
    const argolla = lista.find((c) => c.wooId === 3)!;
    expect(argolla.principalWooId).toBe(1);
    expect(argolla.dentroDe).toBe("Aros");
  });

  it("trata como principal a una categoría cuyo padre no vino", () => {
    expect(prepararCategorias([cat(5, "Huérfana", 99)])[0].principalWooId).toBeNull();
  });

  it("limpia descripción, slug codificado e imagen", () => {
    const [c] = prepararCategorias([
      cat(1, "Niños &amp; Bebés", 0, {
        slug: "ni%c3%b1os-bebes",
        description: "<p>Ropa <b>linda</b></p>",
        image: { src: "https://mitienda.com/a.jpg" },
        count: 7,
      }),
    ]);
    expect(c).toMatchObject({ nombre: "Niños & Bebés", slug: "ninos-bebes", descripcion: "Ropa linda", imagen: "https://mitienda.com/a.jpg", productos: 7 });
  });
});
