"use client";

import { Boton } from "@/components/ui";

export function BotonReintentar() {
  return <Boton onClick={() => window.location.reload()}>Reintentar</Boton>;
}
