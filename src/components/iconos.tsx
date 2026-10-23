import type { SVGProps } from "react";

// Íconos simples en línea (trazo), para no sumar dependencias.
function Icono({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoMenu = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icono>
);

export const IconoCerrar = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icono>
);

export const IconoCarrito = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </Icono>
);

export const IconoUsuario = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Icono>
);

export const IconoBuscar = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icono>
);

export const IconoInicio = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Icono>
);

export const IconoCatalogo = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icono>
);
