import { BotonSalir } from "@/components/boton-salir";
import { Tarjeta } from "@/components/ui";
import { requerirCliente } from "@/lib/auth/dal";

export const metadata = { title: "Mi cuenta · CRV4 Mayorista" };

export default async function CuentaPage() {
  const usuario = await requerirCliente();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
      <Tarjeta className="flex flex-col gap-3">
        <p>Hola, {usuario.nombre}. Aquí verás tus pedidos y direcciones.</p>
        <BotonSalir className="inline-flex min-h-11 items-center self-start rounded-lg border border-borde px-4 text-sm font-medium hover:bg-fondo" />
      </Tarjeta>
    </div>
  );
}
