"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconoCerrar, IconoMenu } from "@/components/iconos";
import type { ItemMenu } from "./menu";

function activo(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Enlaces({
  items,
  pathname,
  alNavegar,
}: {
  items: ItemMenu[];
  pathname: string;
  alNavegar?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={alNavegar}
          aria-current={activo(pathname, item.href) ? "page" : undefined}
          className="flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-200 hover:bg-white/10 aria-[current=page]:bg-white/15 aria-[current=page]:font-medium aria-[current=page]:text-white"
        >
          {item.titulo}
        </Link>
      ))}
    </nav>
  );
}

// Barra lateral fija en tablet y escritorio; menú desplegable en el celular.
export function MenuGestion({
  items,
  usuario,
  pie,
}: {
  items: ItemMenu[];
  usuario: { nombre: string; rol: string };
  pie: ReactNode;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const cabecera = (
    <div>
      <Link href="/admin" className="text-lg font-semibold text-white">
        CRV4 <span className="font-normal text-slate-300">Gestión</span>
      </Link>
      <p className="text-sm text-slate-400">
        {usuario.nombre} · {usuario.rol}
      </p>
    </div>
  );

  return (
    <>
      {/* Celular */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 py-2 md:hidden">
        {cabecera}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-gestion"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="flex size-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
        >
          {abierto ? <IconoCerrar /> : <IconoMenu />}
        </button>
      </header>
      {abierto && (
        <div id="menu-gestion" className="fixed inset-x-0 top-[60px] bottom-0 z-20 overflow-y-auto bg-slate-900 px-4 pb-6 md:hidden">
          <Enlaces items={items} pathname={pathname} alNavegar={() => setAbierto(false)} />
          <div className="mt-4 border-t border-white/10 pt-4">{pie}</div>
        </div>
      )}

      {/* Tablet y escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-slate-900 p-4 md:flex lg:w-64">
        {cabecera}
        <Enlaces items={items} pathname={pathname} />
        <div className="mt-auto border-t border-white/10 pt-4">{pie}</div>
      </aside>
    </>
  );
}
