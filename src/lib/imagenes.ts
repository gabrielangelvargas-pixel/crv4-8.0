import "server-only";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";

// Las fotos se guardan fuera de la carpeta publicada (en Hostinger, ~/imagenes)
// para que no se pierdan en cada despliegue. Se puede cambiar con CARPETA_IMAGENES.
export function carpetaImagenes(): string {
  return process.env.CARPETA_IMAGENES || path.join(homedir(), "imagenes");
}

export const LADO_IMAGEN = 500;
export const TAMANO_MAXIMO = 7 * 1024 * 1024;
const NOMBRE_VALIDO = /^[A-Z0-9-]{1,13}\.webp$/;

export function nombreValido(nombre: string): boolean {
  return NOMBRE_VALIDO.test(nombre);
}

export function rutaImagen(nombre: string): string {
  if (!nombreValido(nombre)) throw new Error("Nombre de imagen inválido");
  return path.join(carpetaImagenes(), nombre);
}

// Ajusta la foto a 500x500 sin recortarla (completa con blanco), corrige la
// rotación del celular y la guarda como WEBP con el código: "7790895000997.webp".
export async function guardarImagenProducto(archivo: File, codigo: string): Promise<string> {
  if (archivo.size > TAMANO_MAXIMO) throw new ErrorImagen("La imagen pesa más de 7 MB");
  const nombre = `${codigo}.webp`;
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
  await mkdir(carpetaImagenes(), { recursive: true });
  await writeFile(rutaImagen(nombre), datos);
  return nombre;
}

export async function borrarImagen(nombre: string | null | undefined): Promise<void> {
  if (!nombre || !nombreValido(nombre)) return;
  await rm(rutaImagen(nombre), { force: true });
}

// Si cambió el código de la variante principal, la foto se renombra para seguirlo.
export async function renombrarImagen(anterior: string, codigo: string): Promise<string> {
  const nombre = `${codigo}.webp`;
  if (anterior === nombre || !nombreValido(anterior)) return anterior;
  try {
    await rename(rutaImagen(anterior), rutaImagen(nombre));
    return nombre;
  } catch {
    return anterior;
  }
}

// Dirección pública de la foto; `version` evita que el navegador muestre la vieja.
export function urlImagen(nombre: string | null | undefined, version?: Date): string | null {
  if (!nombre) return null;
  return `/imagenes/${nombre}${version ? `?v=${version.getTime()}` : ""}`;
}

export class ErrorImagen extends Error {}
