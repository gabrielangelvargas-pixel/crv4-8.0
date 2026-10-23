import { readFile } from "node:fs/promises";
import { nombreValido, rutaImagen } from "@/lib/imagenes";

// Sirve las fotos de productos desde la carpeta de imágenes (fuera del build).
export async function GET(request: Request, { params }: RouteContext<"/imagenes/[archivo]">) {
  const { archivo } = await params;
  if (!nombreValido(archivo)) return new Response("No encontrada", { status: 404 });
  try {
    const datos = await readFile(rutaImagen(archivo));
    const conVersion = new URL(request.url).searchParams.has("v");
    return new Response(new Uint8Array(datos), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": conVersion ? "public, max-age=31536000, immutable" : "public, max-age=300",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}
