"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AreaTexto, BotonPrincipal, Campo, Casilla, MensajeError, Selector } from "@/components/form";
import { Franja } from "@/components/franja";
import { ICONOS_BLOQUE, NOMBRE_ICONO } from "@/lib/iconos-bloque";
import { FRECUENCIAS_AVISO, frasesDeTexto, NOMBRE_FRECUENCIA, type FrecuenciaAviso } from "@/lib/promociones";
import type { EstadoBloques } from "./actions";

type Accion = (prev: EstadoBloques, form: FormData) => Promise<EstadoBloques>;

const claseCaja = "flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-6 lg:max-w-4xl";

// Se envía a mano para que React no vacíe el formulario si el servidor devuelve un error.
function useEnvio(accion: Accion) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [cambiado, setCambiado] = useState(false);
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setCambiado(false);
    startTransition(() => enviar(datos));
  }
  return { estado, enviando, alEnviar, guardado: estado?.ok && !cambiado, marcarCambio: () => setCambiado(true) };
}

function Pie({ estado, enviando, guardado, soloLectura }: { estado: EstadoBloques; enviando: boolean; guardado?: boolean; soloLectura: boolean }) {
  return (
    <>
      <MensajeError>{estado?.error}</MensajeError>
      {guardado && <p role="status" className="text-sm text-green-700">Cambios guardados.</p>}
      {!soloLectura && (
        <BotonPrincipal disabled={enviando} className="self-start">
          {enviando ? "Guardando…" : "Guardar"}
        </BotonPrincipal>
      )}
    </>
  );
}

type InicialFranja = { frases: string; icono: string; colorFondo: string; colorTexto: string; activo: boolean };

export function FranjaForm({ accion, inicial, soloLectura = false }: { accion: Accion; inicial: InicialFranja; soloLectura?: boolean }) {
  const envio = useEnvio(accion);
  const [vista, setVista] = useState(inicial);
  const cambiar = (cambios: Partial<InicialFranja>) => {
    setVista((v) => ({ ...v, ...cambios }));
    envio.marcarCambio();
  };

  return (
    <form onSubmit={envio.alEnviar} className={claseCaja}>
      <div>
        <h2 className="font-semibold">Franja de texto</h2>
        <p className="text-sm text-texto-suave">Frases que pasan de derecha a izquierda en el inicio, debajo de los bloques de información.</p>
      </div>
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <AreaTexto
          etiqueta="Frases (una por renglón)"
          name="frases"
          maxLength={600}
          value={vista.frases}
          onChange={(e) => cambiar({ frases: e.currentTarget.value })}
          placeholder={"Envíos a todo el país\nNuevos ingresos todas las semanas"}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Selector etiqueta="Ícono entre frases" name="icono" value={vista.icono} onChange={(e) => cambiar({ icono: e.currentTarget.value })}>
            {ICONOS_BLOQUE.map((clave) => (
              <option key={clave} value={clave}>
                {NOMBRE_ICONO[clave]}
              </option>
            ))}
          </Selector>
          <Campo etiqueta="Color de fondo" name="colorFondo" type="color" value={vista.colorFondo} onChange={(e) => cambiar({ colorFondo: e.currentTarget.value })} className="p-1" />
          <Campo etiqueta="Color del texto" name="colorTexto" type="color" value={vista.colorTexto} onChange={(e) => cambiar({ colorTexto: e.currentTarget.value })} className="p-1" />
        </div>
        <Casilla etiqueta="Visible (se muestra en la web)" name="activo" checked={vista.activo} onChange={(e) => cambiar({ activo: e.currentTarget.checked })} />
      </fieldset>
      {frasesDeTexto(vista.frases).length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Vista previa</span>
          <Franja frases={frasesDeTexto(vista.frases)} icono={vista.icono} colorFondo={vista.colorFondo} colorTexto={vista.colorTexto} className="rounded-lg" />
        </div>
      )}
      <Pie estado={envio.estado} enviando={envio.enviando} guardado={envio.guardado} soloLectura={soloLectura} />
    </form>
  );
}

type InicialAviso = {
  titulo: string | null;
  texto: string | null;
  imagen: string | null;
  botonTexto: string | null;
  enlace: string | null;
  desde: string | null;
  hasta: string | null;
  frecuencia: FrecuenciaAviso;
  activo: boolean;
};

export function AvisoForm({ accion, inicial, soloLectura = false }: { accion: Accion; inicial: InicialAviso; soloLectura?: boolean }) {
  const envio = useEnvio(accion);
  const [vista, setVista] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);
  const mostrada = vista ?? (quitar ? null : inicial.imagen);

  return (
    <form onSubmit={envio.alEnviar} onChange={envio.marcarCambio} className={claseCaja}>
      <div>
        <h2 className="font-semibold">Aviso emergente</h2>
        <p className="text-sm text-texto-suave">
          Ventana publicitaria que aparece sola al entrar al inicio (no en el resto de las páginas) y se cierra con la ×. Cada vez que lo
          guardas cuenta como un aviso nuevo y se vuelve a mostrar.
        </p>
      </div>
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borde bg-fondo">
            {mostrada ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local o imagen ya optimizada
              <img src={mostrada} alt="" className="size-full object-contain" />
            ) : (
              <span className="text-sm text-texto-suave">Sin imagen</span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Imagen (opcional)</span>
            <span className="text-texto-suave">Ideal vertical 4:5, de 1080 × 1350 píxeles: así ocupa todo el ancho del aviso en celular y en compu. Se muestra completa, sin recortar. Si la imagen ya dice todo, deja vacíos el título y el texto.</span>
            <input
              type="file"
              name="imagen"
              accept="image/*"
              onChange={(e) => {
                const elegido = e.currentTarget.files?.[0];
                setVista(elegido ? URL.createObjectURL(elegido) : null);
              }}
              className="text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-borde file:bg-superficie file:px-4 file:text-sm file:font-medium"
            />
            {inicial.imagen && !vista && (
              <Casilla etiqueta="Quitar la imagen" name="quitarImagen" checked={quitar} onChange={(e) => setQuitar(e.currentTarget.checked)} />
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Título (opcional)" name="titulo" maxLength={80} defaultValue={inicial.titulo ?? ""} />
          <Selector etiqueta="¿Cada cuánto se muestra?" name="frecuencia" defaultValue={inicial.frecuencia}>
            {FRECUENCIAS_AVISO.map((f) => (
              <option key={f} value={f}>
                {NOMBRE_FRECUENCIA[f]}
              </option>
            ))}
          </Selector>
        </div>
        <AreaTexto etiqueta="Texto (opcional; Enter corta la línea)" name="texto" maxLength={300} defaultValue={inicial.texto ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Enlace (opcional)"
            name="enlace"
            defaultValue={inicial.enlace ?? ""}
            placeholder="/catalogo?rubro=aros-plata"
            ayuda="Una página de la web (empieza con /) o una dirección https://. Sin botón, se abre al tocar la imagen."
          />
          <Campo etiqueta="Texto del botón (opcional)" name="botonTexto" maxLength={30} defaultValue={inicial.botonTexto ?? ""} placeholder="Ver ofertas" />
          <Campo etiqueta="Desde (opcional)" name="desde" type="date" defaultValue={inicial.desde ?? ""} />
          <Campo etiqueta="Hasta (opcional)" name="hasta" type="date" defaultValue={inicial.hasta ?? ""} ayuda="Fuera de esas fechas no aparece, aunque esté activo." />
        </div>
        <Casilla etiqueta="Activo (se muestra en la web)" name="activo" defaultChecked={inicial.activo} />
      </fieldset>
      <Pie estado={envio.estado} enviando={envio.enviando} guardado={envio.guardado} soloLectura={soloLectura} />
    </form>
  );
}
