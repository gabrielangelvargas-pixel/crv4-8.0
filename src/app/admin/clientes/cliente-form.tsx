"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AreaTexto, BotonPrincipal, Campo, Casilla, MensajeError } from "@/components/form";
import { Boton } from "@/components/ui";
import type { EstadoFormulario } from "./actions";
import { PROVINCIAS, type DireccionFormulario } from "./datos";

type ClienteInicial = {
  nombre: string;
  telefono: string;
  email: string | null;
  notas: string | null;
  activo: boolean;
};

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  inicial?: ClienteInicial;
  direccionesIniciales?: DireccionFormulario[];
  // El consumidor final no cambia de nombre ni de teléfono.
  datosFijos?: boolean;
  soloLectura?: boolean;
};

type Fila = DireccionFormulario & { clave: number };

let siguienteClave = 0;
function filaVacia(esPrincipal: boolean): Fila {
  return {
    clave: siguienteClave++,
    alias: "",
    calleNumero: "",
    barrio: "",
    localidad: "",
    provincia: "",
    referencias: "",
    esPrincipal,
  };
}

export function ClienteForm({ accion, inicial, direccionesIniciales, datosFijos = false, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [filas, setFilas] = useState<Fila[]>(
    () => direccionesIniciales?.map((d) => ({ ...d, clave: siguienteClave++ })) ?? [],
  );

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
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const lista: DireccionFormulario[] = filas.map((f) => ({
      id: f.id,
      alias: f.alias,
      calleNumero: f.calleNumero,
      barrio: f.barrio,
      localidad: f.localidad,
      provincia: f.provincia,
      referencias: f.referencias,
      esPrincipal: f.esPrincipal,
    }));
    datos.set("direcciones", JSON.stringify(lista));
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5">
      <fieldset disabled={soloLectura} className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-6 lg:max-w-4xl">
          <h2 className="font-semibold">Datos del cliente</h2>
          <Campo
            etiqueta="Nombre y apellido"
            name="nombre"
            required
            defaultValue={inicial?.nombre}
            disabled={datosFijos}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Teléfono"
              name="telefono"
              type="tel"
              required
              defaultValue={inicial?.telefono}
              disabled={datosFijos}
              ayuda="Con característica. Se guarda sin espacios ni guiones."
            />
            <Campo etiqueta="Email (opcional)" name="email" type="email" defaultValue={inicial?.email ?? ""} />
          </div>
          <AreaTexto etiqueta="Notas internas" name="notas" defaultValue={inicial?.notas ?? ""} />
          {!datosFijos && <Casilla etiqueta="Activo" name="activo" defaultChecked={inicial?.activo ?? true} />}
        </section>

        <section className="flex flex-col gap-3 lg:max-w-4xl">
          <div>
            <h2 className="font-semibold">Direcciones</h2>
            <p className="text-sm text-texto-suave">
              {filas.length === 0
                ? "Sin direcciones. Solo hacen falta para los envíos."
                : "La principal es la que se propone en los pedidos con envío."}
            </p>
          </div>
          <datalist id="provincias">
            {PROVINCIAS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <ul className="flex flex-col gap-3">
            {filas.map((f) => (
              <li key={f.clave} className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-5">
                <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                  <div className="min-w-48 flex-1">
                    <Campo
                      etiqueta="Alias (opcional)"
                      value={f.alias}
                      placeholder="Ej.: Casa, Local"
                      maxLength={60}
                      onChange={(e) => cambiar(f.clave, { alias: e.target.value })}
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
                  <Boton type="button" variante="peligro" onClick={() => quitar(f.clave)}>
                    Quitar
                  </Boton>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    etiqueta="Calle y número"
                    value={f.calleNumero}
                    required
                    maxLength={150}
                    onChange={(e) => cambiar(f.clave, { calleNumero: e.target.value })}
                  />
                  <Campo
                    etiqueta="Barrio"
                    value={f.barrio}
                    maxLength={100}
                    onChange={(e) => cambiar(f.clave, { barrio: e.target.value })}
                  />
                  <Campo
                    etiqueta="Localidad"
                    value={f.localidad}
                    required
                    maxLength={100}
                    onChange={(e) => cambiar(f.clave, { localidad: e.target.value })}
                  />
                  <Campo
                    etiqueta="Provincia"
                    value={f.provincia}
                    required
                    list="provincias"
                    maxLength={100}
                    onChange={(e) => cambiar(f.clave, { provincia: e.target.value })}
                  />
                </div>
                <Campo
                  etiqueta="Referencias (opcional)"
                  value={f.referencias}
                  placeholder="Ej.: portón verde, entre calles…"
                  maxLength={255}
                  onChange={(e) => cambiar(f.clave, { referencias: e.target.value })}
                />
              </li>
            ))}
          </ul>
          <Boton
            type="button"
            variante="secundario"
            className="self-start"
            onClick={() => setFilas((actuales) => [...actuales, filaVacia(actuales.length === 0)])}
          >
            + Agregar dirección
          </Boton>
        </section>
      </fieldset>
      <div className="lg:max-w-4xl">
        <MensajeError>{estado?.error}</MensajeError>
      </div>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/clientes" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
