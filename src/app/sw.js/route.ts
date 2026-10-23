// Service worker de la app instalable. Se sirve desde una ruta (y no desde
// public/) para que viaje dentro del build que publica Hostinger.
// No guarda precios ni stock: si no hay conexión muestra la página /sin-conexion.
const CODIGO = `
const CACHE = "crv4-v1";
const SIN_CONEXION = "/sin-conexion";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(SIN_CONEXION)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(SIN_CONEXION)));
});
`;

export function GET() {
  return new Response(CODIGO, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
