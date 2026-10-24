const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

// WordPress devuelve los nombres con entidades HTML ("Plata &amp; Acero").
export function decodificarHtml(texto: string): string {
  return texto.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entera, codigo: string) => {
    if (codigo[0] === "#") {
      const n = codigo[1]?.toLowerCase() === "x" ? parseInt(codigo.slice(2), 16) : parseInt(codigo.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : entera;
    }
    return ENTIDADES[codigo.toLowerCase()] ?? entera;
  });
}
