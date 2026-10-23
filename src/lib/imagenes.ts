import "server-only";
import { mkdir, rename, rm, rmdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { rutaValida } from "@/lib/rutas-imagen";

// Las fotos se guardan fuera de la carpeta publicada (en Hostinger, ~/imagenes)
// para que no se pierdan en cada despliegue. Se puede cambiar con CARPETA_IMAGENES.
export function carpetaImagenes(): string {
  return process.env.CARPETA_IMAGENES || path.join(homedir(), "imagenes");
}

export const LADO_IMAGEN = 500;
export const TAMANO_MAXIMO = 7 * 1024 * 1024;

export function rutaImagen(ruta: string): string {
  if (!rutaValida(ruta)) throw new Error("Ruta de imagen inválida");
  return path.join(carpetaImagenes(), ...ruta.split("/"));
}

// Ajusta la foto a 500x500 sin recortarla (completa con blanco), corrige la
// rotación del celular y la guarda como WEBP en `ruta` ("productos/vasos/7790895000997.webp").
export async function guardarImagenProducto(archivo: File, ruta: string): Promise<string> {
  if (archivo.size > TAMANO_MAXIMO) throw new ErrorImagen("La imagen pesa más de 7 MB");
  let datos: Buffer;
  try {
    datos = await sharp(Buffer.from(await archivo.arrayBuffer()))
      .rotate()
      .resize(LADO_IMAGEN, LADO_IMAGEN, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new ErrorImagen("El archivo no es una imagen válida (JPG, PNG, WEBP…)");
  }
  const destino = rutaImagen(ruta);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  return ruta;
}

export async function borrarImagen(ruta: string | null | undefined): Promise<void> {
  if (!ruta || !rutaValida(ruta)) return;
  await rm(rutaImagen(ruta), { force: true });
  await quitarCarpetaVacia(ruta);
}

// La carpeta de un rubro que se quedó sin fotos se borra (rmdir solo borra vacías).
async function quitarCarpetaVacia(ruta: string): Promise<void> {
  if (!ruta.includes("/")) return;
  await rmdir(path.dirname(rutaImagen(ruta))).catch(() => {});
}

// Si cambió el código principal o el rubro, la foto se mueve para seguirlos.
// Si no se puede mover, queda donde estaba y se sigue usando esa ruta.
export async function moverImagen(anterior: string, nueva: string): Promise<string> {
  if (anterior === nueva || !rutaValida(anterior)) return anterior;
  try {
    const destino = rutaImagen(nueva);
    await mkdir(path.dirname(destino), { recursive: true });
    await rename(rutaImagen(anterior), destino);
    await quitarCarpetaVacia(anterior);
    return nueva;
  } catch {
    return anterior;
  }
}

// Dirección pública de la foto; `version` evita que el navegador muestre la vieja.
export function urlImagen(ruta: string | null | undefined, version?: Date): string | null {
  if (!ruta) return null;
  return `/imagenes/${ruta}${version ? `?v=${version.getTime()}` : ""}`;
}

export class ErrorImagen extends Error {}
