"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AreaTexto, BotonPrincipal, Campo, MensajeError, Selector } from "@/components/form";
import { formatearPrecio } from "@/lib/numeros";
import { confirmarPedido } from "../actions";
import { useCarrito } from "../carrito-local";
import { totalCarrito, useRenglonesCarrito } from "../carrito-vista";

type Props = {
  // null = visitante sin cuenta: se le crea al confirmar.
  cliente: { nombre: string } | null;
  direcciones: { id: number; texto: string }[];
  provincias: string[];
};

function Opcion({ name, value, checked, onChange, titulo, detalle }: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  titulo: string;
  detalle?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${checked ? "border-marca bg-marca-suave" : "border-borde"}`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-0.5 size-5 shrink-0 accent-marca" />
      <span className="text-sm">
        <span className="block font-medium">{titulo}</span>
        {detalle && <span className="text-texto-suave">{detalle}</span>}
      </span>
    </label>
  );
}

export function CheckoutForm({ cliente, direcciones, provincias }: Props) {
  const items = useCarrito();
  const datos = useRenglonesCarrito(items);
  const [estado, enviar, enviando] = useActionState(confirmarPedido, undefined);
  const [entrega, setEntrega] = useState<"retiro" | "envio">("retiro");
  const [direccion, setDireccion] = useState<string>(direcciones[0] ? String(direcciones[0].id) : "nueva");

  if (items.length === 0) {
    return (
      <p className="text-sm text-texto-suave">
        Tu carrito está vacío.{" "}
        <Link href="/catalogo" className="text-marca underline">
          Ver el catálogo
        </Link>
      </p>
    );
  }
  if (!datos) return <p className="text-sm text-texto-suave">Cargando tu carrito…</p>;
  const problemas = items.some((i) => !datos.renglones.get(i.varianteId)?.disponible);

  // Se envía a mano para que React no vacíe el formulario si el servidor devuelve un error.
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    formulario.set("renglones", JSON.stringify(items));
    startTransition(() => enviar(formulario));
  }

  const nuevaDireccion = entrega === "envio" && direccion === "nueva";
  const seccion = "flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-6";

  return (
    <form onSubmit={alEnviar} className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="flex flex-col gap-5">
        {cliente ? (
          <p className="text-sm text-texto-suave">Pedido a nombre de {cliente.nombre}.</p>
        ) : (
          <section className={seccion}>
            <div>
              <h2 className="font-semibold">Tus datos</h2>
              <p className="text-sm text-texto-suave">
                Con tu teléfono y una contraseña te creamos la cuenta para seguir tus pedidos. ¿Ya tenés cuenta?{" "}
                <Link href="/login?next=/carrito/confirmar" className="text-marca underline">
                  Ingresá
                </Link>
              </p>
            </div>
            <Campo etiqueta="Nombre y apellido" name="nombre" required autoComplete="name" maxLength={120} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Teléfono (WhatsApp)" name="telefono" required inputMode="tel" autoComplete="tel" ayuda="Con característica, ej. 341 555 1234. Es tu usuario." />
              <Campo etiqueta="Email (opcional)" name="email" type="email" autoComplete="email" />
              <Campo etiqueta="Contraseña" name="password" type="password" required minLength={8} autoComplete="new-password" ayuda="Mínimo 8 caracteres." />
              <Campo etiqueta="Repetí la contraseña" name="confirmacion" type="password" required minLength={8} autoComplete="new-password" />
            </div>
          </section>
        )}

        <section className={seccion}>
          <h2 className="font-semibold">Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Opcion name="tipoEntrega" value="retiro" checked={entrega === "retiro"} onChange={() => setEntrega("retiro")} titulo="Retiro en el local" detalle="Te avisamos cuando esté listo." />
            <Opcion name="tipoEntrega" value="envio" checked={entrega === "envio"} onChange={() => setEntrega("envio")} titulo="Envío a domicilio" detalle="El costo te lo confirmamos aparte." />
          </div>
          {entrega === "envio" && direcciones.length > 0 && (
            <div className="flex flex-col gap-2">
              {direcciones.map((d) => (
                <Opcion key={d.id} name="direccionId" value={String(d.id)} checked={direccion === String(d.id)} onChange={() => setDireccion(String(d.id))} titulo={d.texto} />
              ))}
              <Opcion name="direccionId" value="0" checked={direccion === "nueva"} onChange={() => setDireccion("nueva")} titulo="Otra dirección" />
            </div>
          )}
          {nuevaDireccion && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Calle y número" name="calleNumero" required maxLength={150} autoComplete="street-address" />
              <Campo etiqueta="Barrio (opcional)" name="barrio" maxLength={100} />
              <Campo etiqueta="Localidad" name="localidad" required maxLength={100} autoComplete="address-level2" />
              <Selector etiqueta="Provincia" name="provincia" required defaultValue="">
                <option value="" disabled>
                  Elegir…
                </option>
                {provincias.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Selector>
              <div className="sm:col-span-2">
                <Campo etiqueta="Referencias (opcional)" name="referencias" maxLength={255} placeholder="Ej.: portón negro, timbre 2" />
              </div>
            </div>
          )}
        </section>

        <section className={seccion}>
          <AreaTexto etiqueta="Notas para el pedido (opcional)" name="notas" maxLength={1000} />
        </section>
      </div>

      <aside className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-4 lg:sticky lg:top-24">
        <h2 className="font-semibold">Tu pedido</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((i) => {
            const r = datos.renglones.get(i.varianteId);
            return (
              <li key={i.varianteId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {i.cantidad} × {r ? `${r.nombre}${r.variante ? ` · ${r.variante}` : ""}` : "Producto no disponible"}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between border-t border-borde pt-3">
          <span className="text-sm text-texto-suave">Total</span>
          <span className="text-2xl font-semibold tabular-nums">{formatearPrecio(totalCarrito(items, datos.renglones))}</span>
        </div>
        <MensajeError>
          {estado?.error}
          {estado?.cuentaExistente && (
            <>
              {" "}
              <Link href="/login?next=/carrito/confirmar" className="font-medium underline">
                Ingresar
              </Link>
            </>
          )}
        </MensajeError>
        {problemas ? (
          <p className="text-sm text-peligro">
            Hay productos sin stock en tu carrito. <Link href="/carrito" className="underline">Revisalo</Link>.
          </p>
        ) : (
          <BotonPrincipal disabled={enviando}>{enviando ? "Enviando…" : "Confirmar pedido"}</BotonPrincipal>
        )}
        <Link href="/carrito" className="text-center text-sm text-marca hover:underline">
          Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
