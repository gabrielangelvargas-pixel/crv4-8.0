import Link from "next/link";
import { after } from "next/server";
import { BotonEnlace, Tarjeta } from "@/components/ui";
import { usuarioActual } from "@/lib/auth/dal";
import { urlImagen } from "@/lib/imagenes";
import { listarCatalogo, PRODUCTOS_POR_PAGINA_WEB, registrarVisitaRubro, rubrosWeb } from "@/lib/catalogo";
import { FilaDeslizable } from "./fila-deslizable";
import { TarjetaProducto } from "./tarjeta-producto";

export const metadata = { title: "Catálogo · CRV4 Mayorista" };

function Chip({ href, activo, pronto, children }: { href: string; activo: boolean; pronto?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 text-sm whitespace-nowrap transition-colors ${
        activo ? "bg-marca font-medium text-white" : "bg-marca-suave text-texto hover:bg-marca/15"
      }`}
    >
      {children}
      {pronto && (
        <span className={`ml-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase ${activo ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
          Pronto
        </span>
      )}
    </Link>
  );
}

// Rubro principal como círculo con su imagen (o su inicial) y el nombre debajo.
function Circulo({
  href,
  activo,
  imagen,
  nombre,
  icono,
  pronto,
}: {
  href: string;
  activo: boolean;
  imagen?: string | null;
  nombre: string;
  icono?: React.ReactNode;
  pronto?: boolean;
}) {
  return (
    <Link href={href} aria-current={activo ? "page" : undefined} className="group relative flex w-18 shrink-0 flex-col items-center gap-1.5 sm:w-22">
      {pronto && (
        <span className="absolute top-12 z-10 rounded-full bg-amber-400 px-1.5 py-px text-[10px] font-bold text-amber-950 uppercase shadow-sm sm:top-16">
          Pronto
        </span>
      )}
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

function IconoTodos() {
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
function MuyPronto({ nombre }: { nombre: string }) {
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

export default async function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  const { q, rubro: slug, pagina } = await searchParams;
  const busqueda = typeof q === "string" ? q : undefined;
  const arbol = await rubrosWeb();
  const principal = arbol.find((r) => r.slug === slug || r.subrubros.some((s) => s.slug === slug));
  const elegido = principal?.slug === slug ? principal : principal?.subrubros.find((s) => s.slug === slug);
  const { filas, total, pagina: actual } = await listarCatalogo({ busqueda, rubro: elegido, pagina: Number(pagina) || 1 });
  const paginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA_WEB));

  // Cuenta para "los más visitados": la primera página de un rubro, sin búsqueda y sin contar al personal.
  if (elegido && actual === 1 && !busqueda && !(await usuarioActual())?.accesoGestion) {
    after(() => registrarVisitaRubro(elegido.id));
  }

  const enlace = (cambios: { rubro?: string; pagina?: number }) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    const r = "rubro" in cambios ? cambios.rubro : elegido?.slug;
    if (r) p.set("rubro", r);
    if (cambios.pagina && cambios.pagina > 1) p.set("pagina", String(cambios.pagina));
    const texto = p.toString();
    return texto ? `/catalogo?${texto}` : "/catalogo";
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{elegido?.nombre ?? "Catálogo"}</h1>
        <p className="mt-1 text-sm text-texto-suave">
          {busqueda ? `Resultados para “${busqueda}” · ` : ""}
          {total === 0 && elegido && !busqueda ? "Próximamente" : total === 1 ? "1 producto" : `${total} productos`}
          {busqueda && (
            <>
              {" · "}
              <Link href={elegido ? `/catalogo?rubro=${elegido.slug}` : "/catalogo"} className="text-marca hover:underline">
                Quitar búsqueda
              </Link>
            </>
          )}
        </p>
      </div>

      {arbol.length > 0 && (
        <nav aria-label="Rubros" className="-mx-4 flex flex-col gap-3">
          <FilaDeslizable className="gap-3 px-4 py-1">
            <Circulo href={enlace({ rubro: undefined })} activo={!principal} nombre="Todos" icono={<IconoTodos />} />
            {arbol.map((r) => (
              <Circulo
                key={r.id}
                href={enlace({ rubro: r.slug })}
                activo={principal?.id === r.id}
                imagen={urlImagen(r.imagen, r.actualizadoEn)}
                nombre={r.nombre}
                pronto={r.vacio}
              />
            ))}
          </FilaDeslizable>
          {principal && principal.subrubros.length > 0 && (
            <FilaDeslizable className="gap-2 px-4">
              <Chip href={enlace({ rubro: principal.slug })} activo={elegido === principal}>
                Todo
              </Chip>
              {principal.subrubros.map((s) => (
                <Chip key={s.id} href={enlace({ rubro: s.slug })} activo={elegido === s} pronto={s.vacio}>
                  {s.nombre}
                </Chip>
              ))}
            </FilaDeslizable>
          )}
        </nav>
      )}

      {filas.length === 0 && elegido && !busqueda ? (
        <MuyPronto nombre={elegido.nombre} />
      ) : filas.length === 0 ? (
        <Tarjeta className="text-sm text-texto-suave">No encontramos productos{busqueda ? " con esa búsqueda" : ""}.</Tarjeta>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filas.map((p) => (
            <TarjetaProducto key={p.id} producto={p} />
          ))}
        </div>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-between gap-2">
          {actual > 1 ? <BotonEnlace variante="secundario" href={enlace({ pagina: actual - 1 })}>Anterior</BotonEnlace> : <span />}
          <span className="text-sm text-texto-suave">
            Página {actual} de {paginas}
          </span>
          {actual < paginas ? <BotonEnlace variante="secundario" href={enlace({ pagina: actual + 1 })}>Siguiente</BotonEnlace> : <span />}
        </div>
      )}
    </div>
  );
}
