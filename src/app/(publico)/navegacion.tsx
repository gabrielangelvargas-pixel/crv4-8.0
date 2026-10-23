"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoCarrito, IconoCatalogo, IconoInicio, IconoUsuario } from "@/components/iconos";

const ITEMS = [
  { href: "/", titulo: "Inicio", Icono: IconoInicio },
  { href: "/catalogo", titulo: "Catálogo", Icono: IconoCatalogo },
  { href: "/carrito", titulo: "Carrito", Icono: IconoCarrito },
  { href: "/cuenta", titulo: "Mi cuenta", Icono: IconoUsuario },
];

function activo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Barra inferior fija en el celular, al alcance del pulgar. Es azul y se extiende por
// debajo de la barra de Android/iPhone (viewport-fit=cover), que así también se ve azul.
export function NavegacionInferior() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 bg-marca pb-[env(safe-area-inset-bottom)] text-white md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, titulo, Icono }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={activo(pathname, href) ? "page" : undefined}
              className="group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-white/75 aria-[current=page]:font-semibold aria-[current=page]:text-white"
            >
              <Icono className="box-content size-6 rounded-full px-3 py-0.5 group-aria-[current=page]:bg-white/20" />
              {titulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Enlaces de la cabecera en tablet y escritorio.
export function NavegacionSuperior() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {ITEMS.slice(0, 2).map(({ href, titulo }) => (
        <Link
          key={href}
          href={href}
          aria-current={activo(pathname, href) ? "page" : undefined}
          className="rounded-lg px-3 py-2 text-sm font-medium text-texto-suave hover:text-marca aria-[current=page]:text-marca"
        >
          {titulo}
        </Link>
      ))}
    </nav>
  );
}
