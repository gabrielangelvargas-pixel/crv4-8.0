import { readFile } from "node:fs/promises";
import { rutaImagen } from "@/lib/imagenes";
import { rutaValida } from "@/lib/rutas-imagen";

// Sirve las fotos desde la carpeta de imágenes (fuera del build):
// /imagenes/productos/vasos/7790895000997.webp
export async function GET(request: Request, { params }: RouteContext<"/imagenes/[...ruta]">) {
  const ruta = (await params).ruta.join("/");
  if (!rutaValida(ruta)) return new Response("No encontrada", { status: 404 });
  try {
    const datos = await readFile(rutaImagen(ruta));
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
