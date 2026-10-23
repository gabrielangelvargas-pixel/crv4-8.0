import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "peligro";

const claseBoton: Record<Variante, string> = {
  primario: "bg-marca text-white hover:bg-marca-oscuro",
  secundario: "border border-borde bg-superficie text-texto hover:bg-fondo",
  peligro: "border border-red-200 bg-superficie text-peligro hover:bg-red-50",
};

const baseBoton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60";

export function Boton({
  variante = "primario",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button {...props} className={`${baseBoton} ${claseBoton[variante]} ${className ?? ""}`} />;
}

export function BotonEnlace({
  variante = "primario",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link {...props} className={`${baseBoton} ${claseBoton[variante]} ${className ?? ""}`} />;
}

// Título de página con acciones; en el celular las acciones bajan debajo.
export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Tarjeta({ className, ...props }: ComponentProps<"div">) {
  return (
    <div {...props} className={`rounded-xl border border-borde bg-superficie p-4 sm:p-6 ${className ?? ""}`} />
  );
}

export function Aviso({ tipo = "info", children }: { tipo?: "info" | "alerta" | "error"; children: ReactNode }) {
  const clases = {
    info: "border-blue-200 bg-marca-suave text-marca-oscuro",
    alerta: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-peligro",
  }[tipo];
  return (
    <p role={tipo === "info" ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${clases}`}>
      {children}
    </p>
  );
}

export function Insignia({ tono = "neutro", children }: { tono?: "neutro" | "exito" | "alerta"; children: ReactNode }) {
  const clases = {
    neutro: "bg-slate-100 text-slate-700",
    exito: "bg-green-50 text-green-700",
    alerta: "bg-amber-50 text-amber-800",
  }[tono];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${clases}`}>{children}</span>;
}

export type Columna<T> = {
  titulo: string;
  celda: (fila: T) => ReactNode;
  // La columna principal encabeza la tarjeta en el celular.
  principal?: boolean;
};

// Tabla en tablet y escritorio; lista de tarjetas en el celular.
export function TablaResponsiva<T>({
  filas,
  columnas,
  clave,
  vacio,
}: {
  filas: T[];
  columnas: Columna<T>[];
  clave: (fila: T) => string | number;
  vacio?: ReactNode;
}) {
  if (filas.length === 0) {
    return <Tarjeta className="text-center text-sm text-texto-suave">{vacio ?? "No hay datos."}</Tarjeta>;
  }
  const principal = columnas.find((c) => c.principal) ?? columnas[0];
  const resto = columnas.filter((c) => c !== principal);

  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {filas.map((fila) => (
          <li key={clave(fila)} className="rounded-xl border border-borde bg-superficie p-4">
            <div className="font-medium">{principal.celda(fila)}</div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {resto.map((c) => (
                <div key={c.titulo} className="contents">
                  <dt className="text-texto-suave">{c.titulo}</dt>
                  <dd>{c.celda(fila)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border border-borde bg-superficie md:block">
        <table className="w-full text-sm">
          <thead className="bg-fondo text-left text-texto-suave">
            <tr>
              {columnas.map((c) => (
                <th key={c.titulo} className="px-4 py-3 font-medium">
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={clave(fila)} className="border-t border-borde align-top">
                {columnas.map((c) => (
                  <td key={c.titulo} className="px-4 py-3">
                    {c.celda(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
