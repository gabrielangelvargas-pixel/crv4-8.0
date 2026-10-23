import type { ComponentProps, ReactNode } from "react";

const claseInput =
  "rounded-md border border-neutral-300 px-3 py-2 text-base disabled:bg-neutral-100";

type CampoProps = ComponentProps<"input"> & { etiqueta: string; ayuda?: string };

export function Campo({ etiqueta, ayuda, className, ...props }: CampoProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {etiqueta}
      <input {...props} className={`${claseInput} ${className ?? ""}`} />
      {ayuda && <span className="text-xs text-neutral-500">{ayuda}</span>}
    </label>
  );
}

export function AreaTexto({ etiqueta, ...props }: ComponentProps<"textarea"> & { etiqueta: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
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
    <label className="flex flex-col gap-1 text-sm">
      {etiqueta}
      <select {...props} className={claseInput}>
        {children}
      </select>
    </label>
  );
}

export function Casilla({ etiqueta, ...props }: ComponentProps<"input"> & { etiqueta: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" {...props} />
      {etiqueta}
    </label>
  );
}

export function MensajeError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-red-600">
      {children}
    </p>
  );
}

export function BotonPrincipal({ children, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}
