import { notFound } from "next/navigation";
import { Aviso, EncabezadoPagina, Insignia } from "@/components/ui";
import { CONSUMIDOR_FINAL } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerCliente } from "@/lib/gestion/clientes";
import { editarCliente, eliminarCliente } from "../actions";
import { ClienteForm } from "../cliente-form";

export const metadata = { title: "Cliente · CRV4" };

export default async function ClientePage({ params, searchParams }: PageProps<"/admin/clientes/[id]">) {
  const usuario = await requerirPermiso("clientes", "ver");
  const id = Number((await params).id);
  const cliente = Number.isInteger(id) ? await obtenerCliente(id) : null;
  if (!cliente) notFound();

  const enUso = (await searchParams)["en-uso"] !== undefined;
  const esConsumidorFinal = cliente.nombre === CONSUMIDOR_FINAL;

  return (
    <>
      <EncabezadoPagina
        titulo={cliente.nombre}
        descripcion={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Insignia>{cliente.origen === "web" ? "Registrado en la web" : "Cargado en el local"}</Insignia>
            {cliente.cuenta && <span>Usuario de la web: {cliente.cuenta}</span>}
          </span>
        }
      />
      {esConsumidorFinal && (
        <Aviso>Este cliente se usa para las ventas presenciales sin datos. Su nombre y teléfono no se cambian.</Aviso>
      )}
      <ClienteForm
        accion={editarCliente.bind(null, cliente.id)}
        inicial={cliente}
        direccionesIniciales={cliente.direcciones.map((d) => ({
          id: d.id,
          alias: d.alias ?? "",
          calleNumero: d.calleNumero,
          barrio: d.barrio ?? "",
          localidad: d.localidad,
          provincia: d.provincia,
          referencias: d.referencias ?? "",
          esPrincipal: d.esPrincipal,
        }))}
        datosFijos={esConsumidorFinal}
        soloLectura={!tienePermiso(usuario, "clientes", "editar")}
      />
      {tienePermiso(usuario, "clientes", "eliminar") && !esConsumidorFinal && (
        <form
          action={eliminarCliente.bind(null, cliente.id)}
          className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 lg:max-w-4xl"
        >
          {enUso && (
            <p role="alert" className="text-sm text-peligro">
              No se puede eliminar porque tiene pedidos o una cuenta en la web. Puedes desactivarlo.
            </p>
          )}
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">
            Eliminar cliente
          </button>
        </form>
      )}
    </>
  );
}
