import Link from "next/link";
import { urlImagen } from "@/lib/imagenes";
import { precioFinal } from "@/lib/catalogo";
import { formatearPrecio } from "@/lib/numeros";

export type ProductoTarjeta = {
  id: number;
  nombre: string;
  imagen: string | null;
  actualizadoEn: Date;
  rubro: string;
  precioVenta: string;
  precioOferta: string | null;
  variantes: number;
  disponible: boolean;
};

export function Foto({ imagen, version, className }: { imagen: string | null; version: Date; className?: string }) {
  const src = urlImagen(imagen, version);
  return (
    <div className={`aspect-square overflow-hidden bg-white ${className ?? ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- la foto ya está optimizada a 500x500 WEBP
        <img src={src} alt="" loading="lazy" className="size-full object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center text-xs text-texto-suave">Sin foto</div>
      )}
    </div>
  );
}

export function Precio({ venta, oferta, grande }: { venta: string; oferta: string | null; grande?: boolean }) {
  const { precio, anterior } = precioFinal(venta, oferta);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-semibold ${grande ? "text-2xl" : "text-base"}`}>{formatearPrecio(precio)}</span>
      {anterior && <span className="text-sm text-texto-suave line-through">{formatearPrecio(anterior)}</span>}
    </p>
  );
}

export function Disponibilidad({ disponible }: { disponible: boolean }) {
  return disponible ? (
    <span className="text-xs font-medium text-green-700">Disponible</span>
  ) : (
    <span className="text-xs font-medium text-texto-suave">Sin stock</span>
  );
}

export function TarjetaProducto({ producto: p }: { producto: ProductoTarjeta }) {
  return (
    <Link
      href={`/catalogo/${p.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-borde bg-superficie transition-shadow hover:shadow-md"
    >
      <Foto imagen={p.imagen} version={p.actualizadoEn} className={p.disponible ? "" : "opacity-60"} />
      <div className="flex flex-1 flex-col gap-1 border-t border-borde p-3">
        <p className="text-xs text-texto-suave">{p.rubro}</p>
        <h2 className="line-clamp-2 text-sm font-medium">{p.nombre}</h2>
        <div className="mt-auto pt-1">
          <Precio venta={p.precioVenta} oferta={p.precioOferta} />
          <div className="flex items-center justify-between gap-2">
            <Disponibilidad disponible={p.disponible} />
            {p.variantes > 1 && <span className="text-xs text-texto-suave">{p.variantes} opciones</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
