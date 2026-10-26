import Link from "next/link";
import { IconoBuscar, IconoCarrito, IconoUsuario } from "@/components/iconos";
import { usuarioActual } from "@/lib/auth/dal";
import { ContadorCarrito } from "./carrito/contador-carrito";
import { NavegacionInferior, NavegacionSuperior } from "./navegacion";

function Buscador({ className }: { className?: string }) {
  return (
    <form action="/catalogo" role="search" className={className}>
      <label className="relative block">
        <span className="sr-only">Buscar productos</span>
        <IconoBuscar className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-texto-suave" />
        <input
          name="q"
          type="search"
          placeholder="Buscar productos"
          className="min-h-11 w-full rounded-full border border-borde bg-fondo pr-4 pl-10 text-base focus:border-marca"
        />
      </label>
    </form>
  );
}

// Web pública, pensada primero para el celular.
export default async function PublicoLayout({ children }: LayoutProps<"/">) {
  const usuario = await usuarioActual();
  return (
    <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {usuario?.accesoGestion && (
        <div className="bg-slate-900 text-sm text-slate-200">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
            <span className="truncate">Estás viendo la web como {usuario.nombre}</span>
            <Link href="/admin" className="shrink-0 font-medium text-white hover:underline">
              Ir a Gestión
            </Link>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-borde bg-superficie/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 md:gap-6 md:py-3">
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-marca">
            CRV4 <span className="font-medium text-texto">Mayorista</span>
          </Link>
          <NavegacionSuperior />
          <Buscador className="hidden flex-1 md:block md:max-w-md" />
          <div className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              href="/carrito"
              aria-label="Carrito"
              className="relative flex size-11 items-center justify-center rounded-full text-texto hover:bg-fondo hover:text-marca"
            >
              <IconoCarrito />
              <ContadorCarrito />
            </Link>
            <Link
              href="/cuenta"
              aria-label="Mi cuenta"
              className="flex size-11 items-center justify-center rounded-full text-texto hover:bg-fondo hover:text-marca"
            >
              <IconoUsuario />
            </Link>
          </div>
        </div>
        <div className="px-4 pb-2 md:hidden">
          <Buscador />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:py-10">{children}</main>

      <footer className="hidden border-t border-borde bg-superficie md:block">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-texto-suave">
          © {new Date().getFullYear()} CRV4 Mayorista
        </div>
      </footer>
      <NavegacionInferior />
    </div>
  );
}
