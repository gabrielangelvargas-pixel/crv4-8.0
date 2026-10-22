import Link from "next/link";
import { BotonSalir } from "@/components/boton-salir";
import { requerirRol } from "@/lib/auth/dal";
import { menuPara } from "./menu";

export default async function GestionLayout({ children }: LayoutProps<"/admin">) {
  const usuario = await requerirRol("admin", "vendedor");

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b border-neutral-200 p-4 md:w-56 md:border-r md:border-b-0">
        <p className="font-semibold">CRV4 · Gestión</p>
        <p className="mb-4 text-sm text-neutral-500">
          {usuario.nombre} ({usuario.rol})
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col">
          {menuPara(usuario.rol).map((item) => (
            <Link key={item.href} href={item.href} className="text-sm hover:underline">
              {item.titulo}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <BotonSalir />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
