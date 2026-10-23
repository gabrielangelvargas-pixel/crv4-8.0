"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AreaTexto, BotonPrincipal, Campo, Casilla, MensajeError, Selector } from "@/components/form";
import type { EstadoFormulario } from "./actions";

type RubroInicial = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  rubroPadreId: number | null;
  orden: number;
  visibleWeb: boolean;
  activo: boolean;
};

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  principales: { id: number; nombre: string }[];
  inicial?: Partial<RubroInicial>;
  soloLectura?: boolean;
};

export function RubroForm({ accion, principales, inicial, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);

  return (
    <form action={enviar} className="flex flex-col gap-5 rounded-xl border border-borde bg-superficie p-4 sm:max-w-2xl sm:p-6">
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre" name="nombre" required defaultValue={inicial?.nombre} />
        <Selector etiqueta="Ubicación" name="rubroPadreId" defaultValue={inicial?.rubroPadreId ?? ""}>
          <option value="">Rubro principal</option>
          {principales.map((r) => (
            <option key={r.id} value={r.id}>
              Subrubro de {r.nombre}
            </option>
          ))}
        </Selector>
        <AreaTexto etiqueta="Descripción" name="descripcion" defaultValue={inicial?.descripcion ?? ""} />
        <Campo
          etiqueta="Dirección web"
          name="slug"
          defaultValue={inicial?.slug}
          ayuda="Se usa en el enlace del catálogo. Si la dejas vacía se arma con el nombre."
        />
        <Campo
          etiqueta="Orden"
          name="orden"
          type="number"
          min={0}
          defaultValue={inicial?.orden ?? 0}
          ayuda="Los números más bajos aparecen primero."
        />
        <Casilla etiqueta="Visible en el catálogo web" name="visibleWeb" defaultChecked={inicial?.visibleWeb ?? true} />
        <Casilla etiqueta="Activo" name="activo" defaultChecked={inicial?.activo ?? true} />
      </fieldset>
      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/rubros" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
