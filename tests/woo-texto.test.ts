import { describe, expect, it } from "vitest";
import { decodificarHtml } from "@/lib/woo-texto";

describe("decodificarHtml", () => {
  it("decodifica entidades con nombre y numéricas", () => {
    expect(decodificarHtml("Plata &amp; Acero &#8211; 925 &#x2F; Aros")).toBe("Plata & Acero – 925 / Aros");
  });
  it("deja intactas las que no conoce", () => {
    expect(decodificarHtml("&raro; sigue")).toBe("&raro; sigue");
  });
});
