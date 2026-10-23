import Link from "next/link";
import { BotonSalir } from "@/components/boton-salir";
import { requerirGestion } from "@/lib/auth/dal";
import { menuPara } from "./menu";
import { MenuGestion } from "./menu-gestion";

export default async function GestionLayout({ children }: LayoutProps<"/admin">) {
  const usuario = await requerirGestion();
  const items = menuPara(usuario).map(({ href, titulo }) => ({ href, titulo }));

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <MenuGestion
        items={items}
        usuario={{ nombre: usuario.nombre, rol: usuario.rol.nombre }}
        pie={
          <>
            <Link
              href="/admin/mi-cuenta"
              className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-slate-300 hover:bg-white/10"
            >
              Mi cuenta
            </Link>
            <BotonSalir className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-slate-300 hover:bg-white/10" />
          </>
        }
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
