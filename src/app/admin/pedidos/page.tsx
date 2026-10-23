import Link from "next/link";
import { IconoBuscar } from "@/components/iconos";
import { Boton, BotonEnlace, EncabezadoPagina, TablaResponsiva } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarPedidos, PEDIDOS_POR_PAGINA, type VistaPedidos } from "@/lib/gestion/pedidos";
import { formatearFecha, formatearPrecio } from "@/lib/numeros";
import { InsigniaEstado } from "./estado";

export const metadata = { title: "Pedidos y ventas · CRV4" };

const VISTAS: { vista: VistaPedidos; titulo: string }[] = [
  { vista: "activos", titulo: "En curso" },
  { vista: "entregados", titulo: "Entregados" },
  { vista: "cancelados", titulo: "Cancelados" },
  { vista: "todos", titulo: "Todos" },
];

export default async function PedidosPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const usuario = await requerirPermiso("pedidos", "ver");
  const { q, vista: v, canal: c, pagina } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const vista = VISTAS.some((x) => x.vista === v) ? (v as VistaPedidos) : "activos";
  const canal = c === "web" || c === "presencial" ? c : undefined;
  const { filas, total, pagina: actual } = await listarPedidos({ vista, canal, busqueda, pagina: Number(pagina) || 1 });
  const paginas = Math.max(1, Math.ceil(total / PEDIDOS_POR_PAGINA));

  const enlace = (cambios: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const valores = { vista: vista === "activos" ? undefined : vista, canal, q: busqueda || undefined, ...cambios };
    for (const [k, val] of Object.entries(valores)) {
      if (val !== undefined && val !== "" && !(k === "pagina" && Number(val) <= 1)) p.set(k, String(val));
    }
    const texto = p.toString();
    return texto ? `/admin/pedidos?${texto}` : "/admin/pedidos";
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Pedidos y ventas"
        acciones={
          tienePermiso(usuario, "pedidos", "crear") && (
            <BotonEnlace href="/admin/pedidos/nueva-venta">Nueva venta en el local</BotonEnlace>
          )
        }
      />
      <nav className="flex gap-1 overflow-x-auto border-b border-borde" aria-label="Estado">
        {VISTAS.map((x) => (
          <Link
            key={x.vista}
            href={enlace({ vista: x.vista === "activos" ? undefined : x.vista, pagina: undefined })}
            aria-current={vista === x.vista ? "page" : undefined}
            className="-mb-px flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-sm text-texto-suave aria-[current=page]:border-marca aria-[current=page]:font-medium aria-[current=page]:text-marca"
          >
            {x.titulo}
          </Link>
        ))}
      </nav>
      <form className="flex flex-col gap-2 sm:flex-row lg:max-w-2xl" role="search">
        {vista !== "activos" && <input type="hidden" name="vista" value={vista} />}
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Número, cliente o teléfono"
          aria-label="Buscar pedido"
          className="min-h-11 min-w-0 rounded-lg border border-borde bg-superficie px-3 text-base sm:flex-1"
        />
        <div className="flex gap-2">
          <select
            name="canal"
            defaultValue={canal ?? ""}
            aria-label="Canal"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-borde bg-superficie px-3 text-base"
          >
            <option value="">Web y local</option>
            <option value="web">Solo web</option>
            <option value="presencial">Solo local</option>
          </select>
          <Boton variante="secundario" aria-label="Buscar">
            <IconoBuscar className="size-5" />
          </Boton>
        </div>
      </form>
      <TablaResponsiva
        filas={filas}
        clave={(p) => p.id}
        vacio="No hay pedidos para mostrar."
        columnas={[
          {
            titulo: "Pedido",
            principal: true,
            celda: (p) => (
              <>
                <Link href={`/admin/pedidos/${p.id}`} className="font-medium text-marca hover:underline">
                  N.º {p.numero} · {p.cliente}
                </Link>
                <p className="font-normal text-texto-suave">
                  {p.canal === "web" ? "Web" : "Local"}
                  {p.canal === "web" && ` · ${p.tipoEntrega === "envio" ? "Envío" : "Retira"}`}
                </p>
              </>
            ),
          },
          { titulo: "Fecha", celda: (p) => formatearFecha(p.fecha) },
          { titulo: "Total", celda: (p) => <span className="font-semibold">{formatearPrecio(p.total)}</span> },
          { titulo: "Estado", celda: (p) => <InsigniaEstado estado={p.estado} /> },
        ]}
      />
      {paginas > 1 && (
        <nav className="flex items-center justify-between gap-2 text-sm" aria-label="Páginas">
          {actual > 1 ? <BotonEnlace variante="secundario" href={enlace({ pagina: actual - 1 })}>Anterior</BotonEnlace> : <span />}
          <span className="text-texto-suave">
            Página {actual} de {paginas}
          </span>
          {actual < paginas ? <BotonEnlace variante="secundario" href={enlace({ pagina: actual + 1 })}>Siguiente</BotonEnlace> : <span />}
        </nav>
      )}
    </>
  );
}
