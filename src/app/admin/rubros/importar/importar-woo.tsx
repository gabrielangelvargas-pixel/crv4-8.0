"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BotonPrincipal, Campo, MensajeError } from "@/components/form";
import { Aviso, Boton, BotonEnlace, Insignia } from "@/components/ui";
import { consultarWoo, importarWoo, type CategoriaVista } from "./actions";

const claseTarjeta = "flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:max-w-3xl sm:p-6";

export function ImportarWoo() {
  const [acceso, setAcceso] = useState({ tienda: "", clave: "", secreto: "" });
  const [consulta, consultar, consultando] = useActionState(consultarWoo, undefined);
  const [importacion, importar, importando] = useActionState(importarWoo, undefined);

  const categorias = consulta && "categorias" in consulta ? consulta.categorias : null;

  function alConsultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => consultar(datos));
  }

  if (importacion && "creados" in importacion) return <Resultado {...importacion} />;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={alConsultar} className={claseTarjeta}>
        <p className="text-sm text-texto-suave">
          En WordPress entrá a <strong>WooCommerce › Ajustes › Avanzado › API REST</strong>, creá una clave con permiso de{" "}
          <strong>Lectura</strong> y copiá acá las dos claves. No se guardan: se usan solo para esta importación.
        </p>
        <Campo
          etiqueta="Dirección de la tienda"
          name="tienda"
          placeholder="https://mitienda.com"
          required
          value={acceso.tienda}
          onChange={(e) => setAcceso({ ...acceso, tienda: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Clave del cliente"
            name="clave"
            placeholder="ck_..."
            required
            autoComplete="off"
            spellCheck={false}
            value={acceso.clave}
            onChange={(e) => setAcceso({ ...acceso, clave: e.target.value })}
          />
          <Campo
            etiqueta="Clave secreta"
            name="secreto"
            type="password"
            placeholder="cs_..."
            required
            autoComplete="off"
            value={acceso.secreto}
            onChange={(e) => setAcceso({ ...acceso, secreto: e.target.value })}
          />
        </div>
        <MensajeError>{consulta && "error" in consulta ? consulta.error : null}</MensajeError>
        <div className="flex flex-wrap gap-2">
          <BotonPrincipal disabled={consultando}>{consultando ? "Consultando la tienda…" : "Ver categorías"}</BotonPrincipal>
          <BotonEnlace variante="secundario" href="/admin/rubros">
            Volver a Rubros
          </BotonEnlace>
        </div>
      </form>

      {categorias && (
        <Seleccion
          key={consulta && "tienda" in consulta ? consulta.tienda + categorias.length : ""}
          categorias={categorias}
          acceso={acceso}
          importar={importar}
          importando={importando}
          error={importacion && "error" in importacion ? importacion.error : null}
        />
      )}
    </div>
  );
}

function Seleccion({
  categorias,
  acceso,
  importar,
  importando,
  error,
}: {
  categorias: CategoriaVista[];
  acceso: { tienda: string; clave: string; secreto: string };
  importar: (datos: FormData) => void;
  importando: boolean;
  error: string | null;
}) {
  const nuevas = categorias.filter((c) => !c.existe);
  const [elegidas, setElegidas] = useState(() => new Set(nuevas.map((c) => c.wooId)));

  function cambiar(c: CategoriaVista, marcar: boolean) {
    const siguiente = new Set(elegidas);
    // Marcar o desmarcar una principal arrastra a sus subcategorías.
    const afectadas = c.principalWooId === null ? [c, ...nuevas.filter((s) => s.principalWooId === c.wooId)] : [c];
    for (const a of afectadas) {
      if (a.existe) continue;
      if (marcar) siguiente.add(a.wooId);
      else siguiente.delete(a.wooId);
    }
    setElegidas(siguiente);
  }

  function alImportar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData();
    datos.set("tienda", acceso.tienda);
    datos.set("clave", acceso.clave);
    datos.set("secreto", acceso.secreto);
    for (const id of elegidas) datos.append("elegida", String(id));
    startTransition(() => importar(datos));
  }

  return (
    <form onSubmit={alImportar} className={claseTarjeta}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          {categorias.length} categorías en la tienda · {nuevas.length} nuevas
        </h2>
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" onClick={() => setElegidas(new Set(nuevas.map((c) => c.wooId)))}>
            Marcar todas
          </Boton>
          <Boton type="button" variante="secundario" onClick={() => setElegidas(new Set())}>
            Ninguna
          </Boton>
        </div>
      </div>
      {categorias.some((c) => c.dentroDe) && (
        <Aviso>Acá los rubros tienen dos niveles: las categorías de un tercer nivel quedan como subrubros de su categoría principal.</Aviso>
      )}
      <ul className="flex flex-col divide-y divide-borde">
        {categorias.map((c) => (
          <li key={c.wooId} className={c.principalWooId === null ? "pt-1" : "pl-8"}>
            <label className={`flex min-h-12 items-center gap-3 py-1.5 text-sm ${c.existe ? "text-texto-suave" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                className="size-5 accent-marca"
                disabled={c.existe}
                checked={c.existe || elegidas.has(c.wooId)}
                onChange={(e) => cambiar(c, e.target.checked)}
              />
              <span className="size-10 shrink-0 overflow-hidden rounded-full bg-marca-suave">
                {c.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element -- vista previa de la imagen de la tienda
                  <img src={c.imagen} alt="" loading="lazy" className="size-full object-cover" />
                )}
              </span>
              <span className="flex flex-1 flex-col">
                <span className={c.principalWooId === null ? "font-semibold" : ""}>{c.nombre}</span>
                <span className="text-xs text-texto-suave">
                  {c.productos === 1 ? "1 producto" : `${c.productos} productos`} en la tienda
                  {c.dentroDe && ` · estaba dentro de ${c.dentroDe}`}
                </span>
              </span>
              {c.existe && <Insignia>Ya existe</Insignia>}
            </label>
          </li>
        ))}
      </ul>
      <MensajeError>{error}</MensajeError>
      <div>
        <BotonPrincipal disabled={importando || elegidas.size === 0}>
          {importando ? "Importando…" : `Importar ${elegidas.size === 1 ? "1 categoría" : `${elegidas.size} categorías`}`}
        </BotonPrincipal>
      </div>
    </form>
  );
}

function Resultado({ creados, existentes, fallidos, sinImagen }: { creados: string[]; existentes: string[]; fallidos: string[]; sinImagen: string[] }) {
  return (
    <div className={claseTarjeta}>
      <h2 className="text-lg font-semibold">
        {creados.length === 1 ? "Se creó 1 rubro" : `Se crearon ${creados.length} rubros`}
      </h2>
      {creados.length > 0 && <p className="text-sm">{creados.join(", ")}.</p>}
      {existentes.length > 0 && (
        <p className="text-sm text-texto-suave">Ya existían y no se tocaron: {existentes.join(", ")}.</p>
      )}
      {sinImagen.length > 0 && <Aviso tipo="alerta">No se pudo traer la imagen de: {sinImagen.join(", ")}. Podés subirla a mano.</Aviso>}
      {fallidos.length > 0 && <Aviso tipo="error">No se importaron: {fallidos.join("; ")}.</Aviso>}
      <p className="text-sm text-texto-suave">Revisá el orden y la visibilidad de cada rubro en la lista.</p>
      <div>
        <Link href="/admin/rubros" className="font-medium text-marca hover:underline">
          Ir a Rubros
        </Link>
      </div>
    </div>
  );
}
