// Rutas de las fotos dentro de la carpeta de imágenes, siempre con "/":
// "productos/<rubro>/<código>.webp". Las primeras fotos quedaron sueltas en la
// raíz ("02101010.webp") y se siguen sirviendo hasta que se mueven al guardar.
// Las de la portada: "portadas/lq3x9k2-escritorio.webp" (nombre nuevo en cada subida);
// la del aviso emergente termina en "-aviso.webp". Las de los rubros: "rubros/lq3x9k2.webp".
const RUTA_PRODUCTO = /^(productos\/[a-z0-9]+(-[a-z0-9]+)*\/)?[A-Z0-9-]{1,13}\.webp$/;
const RUTA_PORTADA = /^portadas\/[a-z0-9]{1,20}-(escritorio|movil|aviso)\.webp$/;
const RUTA_RUBRO = /^rubros\/[a-z0-9]{1,20}\.webp$/;

export function rutaValida(ruta: string): boolean {
  return RUTA_PRODUCTO.test(ruta) || RUTA_PORTADA.test(ruta) || RUTA_RUBRO.test(ruta);
}

// Medidas fijas de la portada: ancha en tablet y compu, cuadrada en el celular.
export const MEDIDAS_PORTADA = {
  escritorio: { ancho: 1920, alto: 640 },
  movil: { ancho: 1080, alto: 1080 },
} as const;
export type FormatoPortada = keyof typeof MEDIDAS_PORTADA;

export function rutaFotoPortada(formato: FormatoPortada | "aviso", unico: string): string {
  return `portadas/${unico}-${formato}.webp`;
}

export function rutaFotoProducto(rubro: string, codigo: string): string {
  return `productos/${rubro}/${codigo}.webp`;
}

export function rutaFotoRubro(unico: string): string {
  return `rubros/${unico}.webp`;
}
