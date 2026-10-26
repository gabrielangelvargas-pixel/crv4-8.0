"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AreaTexto, BotonPrincipal, Campo, Casilla, MensajeError, Selector } from "@/components/form";
import { Aviso, Boton } from "@/components/ui";
import type { TIPOS_VARIANTE } from "@/db/schema";
import type { EstadoFormulario } from "./actions";
import { NOMBRE_TIPO_VARIANTE, type VarianteFormulario } from "./datos";

type TipoVariante = (typeof TIPOS_VARIANTE)[number];

type ProductoInicial = {
  nombre: string;
  descripcion: string | null;
  rubroId: number;
  proveedorId: number | null;
  tipoVariante: TipoVariante;
  visibleWeb: boolean;
  destacado: boolean;
  activo: boolean;
};

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  rubros: { id: number; nombre: string; subrubros: { id: number; nombre: string }[] }[];
  // null = el usuario no puede ver proveedores.
  proveedores: { id: number; nombre: string }[] | null;
  verCosto: boolean;
  inicial?: ProductoInicial;
  variantesIniciales?: (VarianteFormulario & { stock?: string; imagenActual?: string | null })[];
  soloLectura?: boolean;
};

type Fila = VarianteFormulario & {
  clave: number;
  stock?: string;
  imagenActual?: string | null;
  archivo?: File | null;
  vistaPrevia?: string | null;
};

// Antes de subir, la foto se achica en el navegador (el servidor la deja en 500×500):
// así se pueden mandar varias juntas sin pasar el límite del formulario.
async function achicarFoto(archivo: File): Promise<File> {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, 1200 / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, "image/webp", 0.92));
    return blob && blob.size < archivo.size ? new File([blob], "foto.webp", { type: "image/webp" }) : archivo;
  } catch {
    return archivo;
  }
}

const ETIQUETA_VALOR: Record<Exclude<TipoVariante, "ninguna">, [string, string]> = {
  color: ["Color", "Rojo"],
  tamano: ["Tamaño", "Grande"],
  presentacion: ["Presentación", "Blister"],
};

let siguienteClave = 0;
function filaVacia(esPrincipal: boolean): Fila {
  return {
    clave: siguienteClave++,
    valor: "",
    codigo: "",
    codigoProveedor: "",
    precioCosto: "",
    precioVenta: "",
    precioOferta: "",
    activo: true,
    esPrincipal,
  };
}

export function ProductoForm({
  accion,
  rubros,
  proveedores,
  verCosto,
  inicial,
  variantesIniciales,
  soloLectura = false,
}: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [tipo, setTipo] = useState<TipoVariante>(inicial?.tipoVariante ?? "ninguna");
  const [filas, setFilas] = useState<Fila[]>(() =>
    variantesIniciales?.length
      ? variantesIniciales.map((v) => ({ ...v, clave: siguienteClave++ }))
      : [filaVacia(true)],
  );

  const [preparando, setPreparando] = useState(false);

  const conVariantes = tipo !== "ninguna";
  const [etiquetaValor, ejemploValor] = conVariantes ? ETIQUETA_VALOR[tipo] : ["", ""];

  function cambiar(clave: number, cambios: Partial<Fila>) {
    setFilas((actuales) =>
      actuales.map((f) =>
        f.clave === clave ? { ...f, ...cambios } : cambios.esPrincipal ? { ...f, esPrincipal: false } : f,
      ),
    );
  }

  function quitar(clave: number) {
    setFilas((actuales) => {
      const resto = actuales.filter((f) => f.clave !== clave);
      if (!resto.some((f) => f.esPrincipal) && resto[0]) resto[0] = { ...resto[0], esPrincipal: true };
      return resto;
    });
  }

  // Se envía a mano para que React no vacíe el formulario si el servidor devuelve un error.
  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setPreparando(true);
    for (const f of filas) if (f.archivo) datos.set(`foto-${f.clave}`, await achicarFoto(f.archivo));
    setPreparando(false);
    const lista: VarianteFormulario[] = filas.map((f) => ({
      id: f.id,
      valor: f.valor,
      codigo: f.codigo,
      codigoProveedor: f.codigoProveedor,
      precioCosto: f.precioCosto,
      precioVenta: f.precioVenta,
      precioOferta: f.precioOferta,
      activo: f.activo,
      esPrincipal: f.esPrincipal,
      foto: f.archivo ? `foto-${f.clave}` : undefined,
      quitarFoto: f.quitarFoto,
    }));
    datos.set("variantes", JSON.stringify(lista));
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5">
      <fieldset disabled={soloLectura} className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-6 lg:max-w-4xl">
          <h2 className="font-semibold">Datos del producto</h2>
          <Campo etiqueta="Nombre" name="nombre" required defaultValue={inicial?.nombre} />
          <AreaTexto etiqueta="Descripción" name="descripcion" defaultValue={inicial?.descripcion ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector etiqueta="Subrubro" name="rubroId" required defaultValue={inicial?.rubroId ?? ""}>
              <option value="" disabled>
                Elegir…
              </option>
              {rubros.map((r) => (
                <optgroup key={r.id} label={r.nombre}>
                  {r.subrubros.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Selector>
            {proveedores && (
              <Selector etiqueta="Proveedor" name="proveedorId" defaultValue={inicial?.proveedorId ?? ""}>
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Selector>
            )}
            <Selector
              etiqueta="Variantes"
              name="tipoVariante"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoVariante)}
            >
              {Object.entries(NOMBRE_TIPO_VARIANTE).map(([valor, nombre]) => (
                <option key={valor} value={valor}>
                  {valor === "ninguna" ? nombre : `Por ${nombre.toLowerCase()}`}
                </option>
              ))}
            </Selector>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <Casilla etiqueta="Visible en el catálogo web" name="visibleWeb" defaultChecked={inicial?.visibleWeb ?? true} />
            <Casilla etiqueta="Destacado en la portada" name="destacado" defaultChecked={inicial?.destacado ?? false} />
            <Casilla etiqueta="Activo" name="activo" defaultChecked={inicial?.activo ?? true} />
          </div>
        </section>

        <section className="flex flex-col gap-3 lg:max-w-4xl">
          <div>
            <h2 className="font-semibold">{conVariantes ? `Variantes por ${etiquetaValor.toLowerCase()}` : "Código y precios"}</h2>
            <p className="text-sm text-texto-suave">
              {conVariantes
                ? "Cada variante tiene su propia foto, código de barras, precio y stock."
                : "El código es el interno y el de barras (hasta 13 caracteres)."}
            </p>
          </div>
          {!conVariantes && filas.length > 1 && (
            <Aviso tipo="alerta">
              Este producto tiene {filas.length} variantes. Para dejarlo sin variantes, quita todas menos una.
            </Aviso>
          )}
          <ul className="flex flex-col gap-3">
            {filas.map((f, i) => (
              <li key={f.clave} className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-5">
                {(conVariantes || filas.length > 1) && (
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <div className="min-w-48 flex-1">
                      <Campo
                        etiqueta={conVariantes ? etiquetaValor : "Variante"}
                        value={f.valor}
                        placeholder={`Ej.: ${ejemploValor || "Única"}`}
                        onChange={(e) => cambiar(f.clave, { valor: e.target.value })}
                        required={conVariantes}
                        maxLength={80}
                      />
                    </div>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="principal"
                        className="size-5 accent-marca"
                        checked={f.esPrincipal}
                        onChange={() => cambiar(f.clave, { esPrincipal: true })}
                      />
                      Principal
                    </label>
                    {filas.length > 1 && (
                      <Boton type="button" variante="peligro" onClick={() => quitar(f.clave)}>
                        Quitar
                      </Boton>
                    )}
                  </div>
                )}
                <FotoVariante fila={f} cambiar={(cambios) => cambiar(f.clave, cambios)} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Campo
                    etiqueta="Código / código de barras"
                    value={f.codigo}
                    onChange={(e) => cambiar(f.clave, { codigo: e.target.value.toUpperCase() })}
                    required
                    maxLength={13}
                    autoCapitalize="characters"
                  />
                  {proveedores && (
                    <Campo
                      etiqueta="Código del proveedor"
                      value={f.codigoProveedor}
                      onChange={(e) => cambiar(f.clave, { codigoProveedor: e.target.value })}
                      maxLength={40}
                    />
                  )}
                  {verCosto && (
                    <Campo
                      etiqueta="Precio de costo"
                      inputMode="decimal"
                      value={f.precioCosto}
                      placeholder="0,00"
                      onChange={(e) => cambiar(f.clave, { precioCosto: e.target.value })}
                    />
                  )}
                  <Campo
                    etiqueta="Precio de venta"
                    inputMode="decimal"
                    value={f.precioVenta}
                    placeholder="0,00"
                    onChange={(e) => cambiar(f.clave, { precioVenta: e.target.value })}
                    required
                  />
                  <Campo
                    etiqueta="Precio de oferta"
                    inputMode="decimal"
                    value={f.precioOferta}
                    onChange={(e) => cambiar(f.clave, { precioOferta: e.target.value })}
                    ayuda="Vacío = sin oferta."
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {conVariantes || filas.length > 1 ? (
                    <Casilla
                      etiqueta="Activa"
                      checked={f.activo}
                      onChange={(e) => cambiar(f.clave, { activo: e.target.checked })}
                    />
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-texto-suave">
                    {f.stock !== undefined ? `Stock actual: ${f.stock}` : i === 0 && !f.id ? "El stock se carga desde Stock." : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {conVariantes && (
            <Boton
              type="button"
              variante="secundario"
              className="self-start"
              onClick={() => setFilas((actuales) => [...actuales, filaVacia(actuales.length === 0)])}
            >
              + Agregar variante
            </Boton>
          )}
        </section>
      </fieldset>
      <div className="lg:max-w-4xl">
        <MensajeError>{estado?.error}</MensajeError>
      </div>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={preparando || enviando}>{preparando || enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/productos" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}

function FotoVariante({ fila: f, cambiar }: { fila: Fila; cambiar: (cambios: Partial<Fila>) => void }) {
  const mostrada = f.vistaPrevia ?? (f.quitarFoto ? null : f.imagenActual);
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borde bg-white">
        {mostrada ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local o foto ya optimizada
          <img src={mostrada} alt={`Foto ${f.valor}`.trim()} className="size-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-texto-suave">Sin foto</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          aria-label="Elegir foto"
          onChange={(e) => {
            const archivo = e.target.files?.[0] ?? null;
            cambiar({ archivo, vistaPrevia: archivo ? URL.createObjectURL(archivo) : null, quitarFoto: false });
          }}
          className="max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-borde file:bg-superficie file:px-4 file:text-sm file:font-medium hover:file:bg-fondo"
        />
        <p className="text-xs text-texto-suave">Se ajusta a 500×500 y se guarda en WEBP con el código de la variante.</p>
        {f.imagenActual && !f.archivo && (
          <Casilla
            etiqueta="Quitar la foto"
            checked={f.quitarFoto ?? false}
            onChange={(e) => cambiar({ quitarFoto: e.target.checked })}
          />
        )}
      </div>
    </div>
  );
}
