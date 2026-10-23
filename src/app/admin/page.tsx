import Link from "next/link";
import { Aviso, EncabezadoPagina } from "@/components/ui";
import { requerirGestion } from "@/lib/auth/dal";
import { menuPara } from "./menu";

export default async function GestionInicio({ searchParams }: PageProps<"/admin">) {
  const usuario = await requerirGestion();
  const sinPermiso = (await searchParams)["sin-permiso"] !== undefined;
  const secciones = menuPara(usuario).filter((item) => item.href !== "/admin");

  return (
    <>
      {sinPermiso && <Aviso tipo="alerta">Tu rol no tiene permiso para esa sección.</Aviso>}
      <EncabezadoPagina titulo={`Hola, ${usuario.nombre}`} descripcion="¿Qué quieres hacer hoy?" />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {secciones.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-20 items-center rounded-xl border border-borde bg-superficie px-5 font-medium transition-colors hover:border-marca hover:text-marca"
            >
              {item.titulo}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
