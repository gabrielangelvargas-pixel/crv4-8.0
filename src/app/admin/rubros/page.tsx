import Link from "next/link";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { arbolDeRubros, type Rubro } from "@/lib/gestion/rubros";

export const metadata = { title: "Rubros · CRV4" };

function Etiquetas({ rubro }: { rubro: Rubro }) {
  return (
    <span className="ml-2 text-xs text-neutral-500">
      {!rubro.activo && "inactivo · "}
      {!rubro.visibleWeb && "oculto en la web"}
    </span>
  );
}

export default async function RubrosPage() {
  const usuario = await requerirPermiso("rubros", "ver");
  const arbol = await arbolDeRubros();
  const puedeCrear = tienePermiso(usuario, "rubros", "crear");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Rubros</h1>
        {puedeCrear && (
          <Link href="/admin/rubros/nuevo" className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white">
            Nuevo rubro
          </Link>
        )}
      </div>
      {arbol.length === 0 && <p className="text-neutral-600">Todavía no hay rubros cargados.</p>}
      <ul className="flex flex-col gap-3">
        {arbol.map((rubro) => (
          <li key={rubro.id} className="rounded-md border border-neutral-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/admin/rubros/${rubro.id}`} className="font-medium hover:underline">
                  {rubro.nombre}
                </Link>
                <Etiquetas rubro={rubro} />
              </div>
              {puedeCrear && (
                <Link href={`/admin/rubros/nuevo?padre=${rubro.id}`} className="text-sm underline underline-offset-4">
                  Agregar subrubro
                </Link>
              )}
            </div>
            {rubro.subrubros.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 border-l border-neutral-200 pl-4">
                {rubro.subrubros.map((sub) => (
                  <li key={sub.id} className="text-sm">
                    <Link href={`/admin/rubros/${sub.id}`} className="hover:underline">
                      {sub.nombre}
                    </Link>
                    <Etiquetas rubro={sub} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
