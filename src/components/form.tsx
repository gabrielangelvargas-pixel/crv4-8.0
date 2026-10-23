import type { ComponentProps, ReactNode } from "react";

// text-base evita que el celular haga zoom al tocar el campo; min-h-11 da un
// área táctil cómoda.
const claseInput =
  "min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base focus:border-marca disabled:bg-fondo disabled:text-texto-suave";

type CampoProps = ComponentProps<"input"> & { etiqueta: string; ayuda?: string };

export function Campo({ etiqueta, ayuda, className, ...props }: CampoProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {etiqueta}
      <input {...props} className={`${claseInput} ${className ?? ""}`} />
      {ayuda && <span className="text-xs font-normal text-texto-suave">{ayuda}</span>}
    </label>
  );
}

export function AreaTexto({ etiqueta, ...props }: ComponentProps<"textarea"> & { etiqueta: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {etiqueta}
      <textarea rows={3} {...props} className={claseInput} />
    </label>
  );
}

export function Selector({
  etiqueta,
  children,
  ...props
}: ComponentProps<"select"> & { etiqueta: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {etiqueta}
      <select {...props} className={claseInput}>
        {children}
      </select>
    </label>
  );
}

export function Casilla({ etiqueta, ...props }: ComponentProps<"input"> & { etiqueta: string }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm">
      <input type="checkbox" className="size-5 accent-marca" {...props} />
      {etiqueta}
    </label>
  );
}

export function MensajeError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-peligro">
      {children}
    </p>
  );
}

export { Boton as BotonPrincipal } from "./ui";
