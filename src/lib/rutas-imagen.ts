// Rutas de las fotos dentro de la carpeta de imágenes, siempre con "/":
// "productos/<rubro>/<código>.webp". Las primeras fotos quedaron sueltas en la
// raíz ("02101010.webp") y se siguen sirviendo hasta que se mueven al guardar.
const RUTA_VALIDA = /^(productos\/[a-z0-9]+(-[a-z0-9]+)*\/)?[A-Z0-9-]{1,13}\.webp$/;

export function rutaValida(ruta: string): boolean {
  return RUTA_VALIDA.test(ruta);
}

export function rutaFotoProducto(rubro: string, codigo: string): string {
  return `productos/${rubro}/${codigo}.webp`;
}
