import type { MetadataRoute } from "next";
import icono192 from "./pwa/icono-192.png";
import icono512 from "./pwa/icono-512.png";
import iconoMaskable from "./pwa/icono-maskable-512.png";

// Hace la web instalable como app en el celular y la compu.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CRV4 Mayorista",
    short_name: "CRV4",
    description: "Catálogo y gestión de pedidos, ventas y stock",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e40af",
    icons: [
      { src: icono192.src, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icono512.src, sizes: "512x512", type: "image/png", purpose: "any" },
      // Android recorta el ícono en círculo: esta versión tiene margen y fondo blanco.
      { src: iconoMaskable.src, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Catálogo", url: "/catalogo" },
      { name: "Gestión", url: "/admin" },
    ],
  };
}
