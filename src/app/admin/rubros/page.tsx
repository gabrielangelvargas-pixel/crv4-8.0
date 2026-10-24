import Link from "next/link";
import { BotonEnlace, EncabezadoPagina, Insignia, Tarjeta } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { arbolDeRubros, type Rubro } from "@/lib/gestion/rubros";

export const metadata = { title: "Rubros · CRV4" };

function Etiquetas({ rubro }: { rubro: Rubro }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {!rubro.activo && <Insignia>Inactivo</Insignia>}
      {!rubro.visibleWeb && <Insignia tono="alerta">Oculto en la web</Insignia>}
    </span>
  );
}

export default async function RubrosPage() {
  const usuario = await requerirPermiso("rubros", "ver");
  const arbol = await arbolDeRubros();
  const puedeCrear = tienePermiso(usuario, "rubros", "crear");

  return (
    <>
      <EncabezadoPagina
        titulo="Rubros"
        descripcion="Rubros principales y sus subrubros, en el orden del catálogo."
        acciones={puedeCrear && <BotonEnlace href="/admin/rubros/nuevo">Nuevo rubro</BotonEnlace>}
      />
      {arbol.length === 0 && (
        <Tarjeta className="text-center text-sm text-texto-suave">Todavía no hay rubros cargados.</Tarjeta>
      )}
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {arbol.map((rubro) => (
          <li key={rubro.id} className="rounded-xl border border-borde bg-superficie p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/rubros/${rubro.id}`} className="font-semibold text-marca hover:underline">
                  {rubro.nombre}
                </Link>
                <Etiquetas rubro={rubro} />
              </div>
              {puedeCrear && (
                <Link
                  href={`/admin/rubros/nuevo?padre=${rubro.id}`}
                  className="inline-flex min-h-11 items-center text-sm text-texto-suave hover:text-marca"
                >
                  + Agregar subrubro
                </Link>
              )}
            </div>
            {rubro.subrubros.length > 0 ? (
              <ul className="mt-2 flex flex-col border-l-2 border-borde pl-3">
                {rubro.subrubros.map((sub) => (
                  <li key={sub.id} className="flex min-h-10 flex-wrap items-center gap-2 text-sm">
                    <Link href={`/admin/rubros/${sub.id}`} className="hover:text-marca hover:underline">
                      {sub.nombre}
                    </Link>
                    <Etiquetas rubro={sub} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-texto-suave">Sin subrubros.</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
