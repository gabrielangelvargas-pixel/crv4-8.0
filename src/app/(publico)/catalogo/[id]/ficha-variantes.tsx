"use client";

import { useState } from "react";

// Ficha de un producto con variantes: al elegir una, cambian la foto y el código.
// Las fotos y las opciones llegan ya armadas desde el servidor, en el mismo orden.
export function FichaVariantes({
  nombre,
  titulo,
  codigos,
  fotos,
  opciones,
  children,
}: {
  nombre: string;
  titulo: string;
  codigos: string[];
  fotos: React.ReactNode[];
  opciones: React.ReactNode[];
  children: React.ReactNode;
}) {
  const [elegida, setElegida] = useState(0);

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      {fotos[elegida]}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{nombre}</h1>
          <p className="mt-1 text-sm text-texto-suave">Código {codigos[elegida]}</p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{titulo}</legend>
          <div className="divide-y divide-borde rounded-xl border border-borde bg-superficie">
            {opciones.map((opcion, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl ${
                  i === elegida ? "bg-marca-suave" : "hover:bg-fondo"
                }`}
              >
                <input
                  type="radio"
                  name="variante"
                  className="size-5 shrink-0 accent-marca"
                  checked={i === elegida}
                  onChange={() => setElegida(i)}
                />
                {opcion}
              </label>
            ))}
          </div>
        </fieldset>
        {children}
      </div>
    </div>
  );
}
