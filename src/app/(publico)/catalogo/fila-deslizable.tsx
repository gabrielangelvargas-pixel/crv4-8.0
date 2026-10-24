"use client";

import { useEffect, useRef } from "react";

// Fila con desplazamiento horizontal que deja a la vista el elemento elegido.
export function FilaDeslizable({ className, children }: { className?: string; children: React.ReactNode }) {
  const fila = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = fila.current;
    const activo = contenedor?.querySelector<HTMLElement>("[aria-current=page]");
    if (!contenedor || !activo) return;
    const izquierda = activo.offsetLeft - (contenedor.clientWidth - activo.offsetWidth) / 2;
    contenedor.scrollTo({ left: Math.max(0, izquierda) });
  });

  return (
    <div ref={fila} className={`relative flex overflow-x-auto [scrollbar-width:none] ${className ?? ""}`}>
      {children}
    </div>
  );
}
