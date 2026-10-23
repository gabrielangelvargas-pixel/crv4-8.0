"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Campo, MensajeError } from "@/components/form";
import { IconoBuscar } from "@/components/iconos";
import { Boton, Insignia } from "@/components/ui";
import { formatearCantidad, formatearPrecio, leerDecimal } from "@/lib/numeros";
import { calcularTotales } from "@/lib/pedidos";
import { buscarClientes, buscarVariantes, crearVentaPresencial, type ResultadoVariante } from "../actions";

type Renglon = ResultadoVariante & { cantidad: string };
type ClienteElegido = { id: number; nombre: string; telefono: string };

const claseInput = "min-h-11 w-full min-w-0 rounded-lg border border-borde bg-superficie px-3 text-base";

// Busca mientras se escribe, esperando a que se deje de tipear.
function useBusqueda<T>(buscar: (texto: string) => Promise<T[]>) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<T[]>([]);
  useEffect(() => {
    if (texto.trim().length < 2) return;
    let vigente = true;
    const espera = setTimeout(() => {
      buscar(texto).then((r) => vigente && setResultados(r));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto, buscar]);
  return { texto, setTexto, resultados: texto.trim().length < 2 ? [] : resultados, limpiar: () => setTexto("") };
}

export function VentaForm({
  consumidorFinal,
  puedeCrearClientes,
}: {
  consumidorFinal: ClienteElegido | null;
  puedeCrearClientes: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(crearVentaPresencial, undefined);
  const [renglones, setRenglones] = useState<Renglon[]>([]);
  const [cliente, setCliente] = useState<ClienteElegido | null>(consumidorFinal);
  const [modoCliente, setModoCliente] = useState<"elegido" | "buscar" | "nuevo">("elegido");
  const [adicional, setAdicional] = useState("");
  const productos = useBusqueda(buscarVariantes);
  const clientes = useBusqueda(buscarClientes);
  const buscador = useRef<HTMLInputElement>(null);

  function agregar(v: ResultadoVariante) {
    setRenglones((actuales) => {
      const existente = actuales.find((r) => r.id === v.id);
      if (existente) {
        return actuales.map((r) =>
          r.id === v.id ? { ...r, cantidad: String((Number(leerDecimal(r.cantidad, 3) ?? 0) + 1)).replace(".", ",") } : r,
        );
      }
      return [...actuales, { ...v, cantidad: "1" }];
    });
    productos.limpiar();
    buscador.current?.focus();
  }

  // Enter en el buscador agrega el primer resultado: sirve con lector de código de barras.
  async function alEnterEnBuscador() {
    const lista = await buscarVariantes(productos.texto);
    if (lista[0]) agregar(lista[0]);
  }

  const totales = calcularTotales(
    renglones.map((r) => ({ cantidad: leerDecimal(r.cantidad, 3) ?? "0", precioUnitario: r.precio, precioCosto: "0" })),
    leerDecimal(adicional) ?? "0",
  );

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    datos.set("items", JSON.stringify(renglones.map((r) => ({ varianteId: r.id, cantidad: r.cantidad }))));
    datos.set("clienteId", String(cliente?.id ?? ""));
    datos.set("clienteNuevo", modoCliente === "nuevo" ? "1" : "0");
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex flex-col gap-4">
        {/* Buscador de productos */}
        <section className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-4 sm:p-5">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Agregar producto
            <div className="relative">
              <IconoBuscar className="pointer-events-none absolute top-3 left-3 size-5 text-texto-suave" />
              <input
                ref={buscador}
                value={productos.texto}
                onChange={(e) => productos.setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    alEnterEnBuscador();
                  }
                }}
                placeholder="Nombre o código de barras"
                autoFocus
                autoComplete="off"
                className={`${claseInput} pl-10`}
              />
            </div>
          </label>
          {productos.resultados.length > 0 && (
            <ul className="flex max-h-80 flex-col divide-y divide-borde overflow-y-auto rounded-lg border border-borde">
              {productos.resultados.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => agregar(v)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-fondo"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{v.descripcion}</span>
                      <span className="block text-xs text-texto-suave">
                        {v.codigo} · Stock {formatearCantidad(v.stock)}
                        {Number(v.disponible) <= 0 && " · sin disponible"}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{formatearPrecio(v.precio)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Renglones */}
        <section className="flex flex-col gap-2">
          {renglones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-borde p-6 text-center text-sm text-texto-suave">
              Busca o escanea productos para armar la venta.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {renglones.map((r, i) => {
                const cantidad = leerDecimal(r.cantidad, 3);
                return (
                  <li key={r.id} className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.descripcion}</p>
                      <p className="text-sm text-texto-suave">
                        {r.codigo} · {formatearPrecio(r.precio)} c/u
                        {r.precio !== r.precioLista && <> · <Insignia tono="alerta">Oferta</Insignia></>}
                        {cantidad && Number(cantidad) > Number(r.stock) && (
                          <span className="text-peligro"> · supera el stock ({formatearCantidad(r.stock)})</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        aria-label={`Cantidad de ${r.descripcion}`}
                        inputMode="decimal"
                        value={r.cantidad}
                        onChange={(e) =>
                          setRenglones((actuales) => actuales.map((x) => (x.id === r.id ? { ...x, cantidad: e.target.value } : x)))
                        }
                        className={`${claseInput} w-24 text-center ${cantidad === null || Number(cantidad) <= 0 ? "border-peligro" : ""}`}
                      />
                      <span className="w-28 text-right font-semibold">{formatearPrecio(totales.items[i].subtotal)}</span>
                      <button
                        type="button"
                        onClick={() => setRenglones((actuales) => actuales.filter((x) => x.id !== r.id))}
                        aria-label={`Quitar ${r.descripcion}`}
                        className="flex size-11 items-center justify-center rounded-lg text-xl text-peligro hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Resumen */}
      <aside className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-5 lg:sticky lg:top-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Cliente</h2>
          {modoCliente === "elegido" && (
            <div className="flex items-center justify-between gap-3">
              <span>
                {cliente?.nombre ?? "Sin cliente"}
                {cliente && /\d/.test(cliente.telefono) && (
                  <span className="block text-sm text-texto-suave">{cliente.telefono}</span>
                )}
              </span>
              <button type="button" onClick={() => setModoCliente("buscar")} className="text-sm text-marca hover:underline">
                Cambiar
              </button>
            </div>
          )}
          {modoCliente === "buscar" && (
            <div className="flex flex-col gap-2">
              <input
                value={clientes.texto}
                onChange={(e) => clientes.setTexto(e.target.value)}
                placeholder="Nombre o teléfono"
                aria-label="Buscar cliente"
                autoFocus
                className={claseInput}
              />
              {clientes.resultados.length > 0 && (
                <ul className="flex flex-col divide-y divide-borde rounded-lg border border-borde">
                  {clientes.resultados.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCliente(c);
                          setModoCliente("elegido");
                          clientes.limpiar();
                        }}
                        className="flex min-h-11 w-full flex-col justify-center px-3 py-1 text-left hover:bg-fondo"
                      >
                        <span>{c.nombre}</span>
                        {/\d/.test(c.telefono) && <span className="text-xs text-texto-suave">{c.telefono}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-4 text-sm">
                {puedeCrearClientes && (
                  <button type="button" onClick={() => setModoCliente("nuevo")} className="text-marca hover:underline">
                    Cliente nuevo
                  </button>
                )}
                <button type="button" onClick={() => setModoCliente("elegido")} className="text-texto-suave hover:underline">
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {modoCliente === "nuevo" && (
            <div className="flex flex-col gap-3">
              <Campo etiqueta="Nombre y apellido" name="nuevoNombre" required autoFocus />
              <Campo etiqueta="Teléfono" name="nuevoTelefono" type="tel" required />
              <button type="button" onClick={() => setModoCliente("elegido")} className="self-start text-sm text-texto-suave hover:underline">
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_8rem] gap-2">
          <Campo etiqueta="Adicional (detalle)" name="adicionalDetalle" placeholder="Ej.: Envío" maxLength={100} />
          <Campo
            etiqueta="Importe"
            name="adicional"
            inputMode="decimal"
            placeholder="0,00"
            value={adicional}
            onChange={(e) => setAdicional(e.target.value)}
          />
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Notas internas
          <textarea name="notasInternas" rows={2} className={`${claseInput} py-2`} />
        </label>

        <dl className="flex flex-col gap-1 border-t border-borde pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-texto-suave">Subtotal</dt>
            <dd>{formatearPrecio(totales.subtotal)}</dd>
          </div>
          {Number(leerDecimal(adicional) ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt className="text-texto-suave">Adicional</dt>
              <dd>{formatearPrecio(leerDecimal(adicional) ?? 0)}</dd>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatearPrecio(totales.total)}</dd>
          </div>
        </dl>
        <MensajeError>{estado?.error}</MensajeError>
        <Boton disabled={enviando || renglones.length === 0} className="w-full">
          {enviando ? "Registrando…" : "Registrar venta"}
        </Boton>
        <p className="text-xs text-texto-suave">La venta queda entregada y descuenta el stock al registrarla.</p>
      </aside>
    </form>
  );
}
