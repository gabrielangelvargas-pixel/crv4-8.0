import Link from "next/link";
import { BotonEnlace, Tarjeta } from "@/components/ui";

// Piezas del catálogo público: círculos de rubros, botones de subrubros y aviso de categoría vacía.

export function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 text-sm whitespace-nowrap transition-colors ${
        activo ? "bg-marca font-medium text-white" : "bg-marca-suave text-texto hover:bg-marca/15"
      }`}
    >
      {children}
    </Link>
  );
}

// Rubro principal como círculo con su imagen (o su inicial) y el nombre debajo.
export function Circulo({ href, activo, imagen, nombre, icono }: { href: string; activo: boolean; imagen?: string | null; nombre: string; icono?: React.ReactNode }) {
  return (
    <Link href={href} aria-current={activo ? "page" : undefined} className="group flex w-18 shrink-0 flex-col items-center gap-1.5 sm:w-22">
      <span
        className={`flex size-16 items-center justify-center overflow-hidden rounded-full bg-marca-suave ring-offset-2 ring-offset-fondo transition sm:size-20 ${
          activo ? "ring-2 ring-marca" : "ring-1 ring-borde group-hover:ring-marca"
        }`}
      >
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element -- la imagen ya está optimizada a 600x600 WEBP
          <img src={imagen} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          (icono ?? <span className="text-2xl font-bold text-marca/50">{nombre.charAt(0)}</span>)
        )}
      </span>
      <span className={`line-clamp-2 text-center text-xs leading-tight ${activo ? "font-semibold text-marca" : "text-texto"}`}>{nombre}</span>
    </Link>
  );
}

export function IconoTodos() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 fill-marca">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

// Categoría todavía sin productos a la vista.
export function MuyPronto({ nombre }: { nombre: string }) {
  return (
    <Tarjeta className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-amber-100">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 fill-none stroke-amber-600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 21h14M5 3h14M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3" />
        </svg>
      </span>
      <div>
        <p className="text-lg font-semibold">¡Muy pronto!</p>
        <p className="mt-1 max-w-sm text-sm text-texto-suave">
          Estamos preparando los productos de <strong className="font-medium text-texto">{nombre}</strong>. Mientras tanto, te invitamos a recorrer el resto del catálogo.
        </p>
      </div>
      <BotonEnlace href="/catalogo">Ver todo el catálogo</BotonEnlace>
    </Tarjeta>
  );
}
