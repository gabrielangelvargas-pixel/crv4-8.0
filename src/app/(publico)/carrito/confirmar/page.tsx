import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PROVINCIAS, textoDireccion } from "@/app/admin/clientes/datos";
import { Aviso } from "@/components/ui";
import { db } from "@/db";
import { direcciones } from "@/db/schema";
import { usuarioActual } from "@/lib/auth/dal";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Confirmar pedido · CRV4 Mayorista" };

export default async function ConfirmarPage() {
  const usuario = await usuarioActual();

  if (usuario?.accesoGestion) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Confirmar pedido</h1>
        <Aviso tipo="alerta">
          Estás con un usuario de gestión ({usuario.nombre}). Para hacer un pedido desde la web, salí e ingresá como cliente; para
          cargar una venta usá <Link href="/admin/pedidos" className="underline">Gestión › Pedidos</Link>.
        </Aviso>
      </div>
    );
  }

  const guardadas =
    usuario?.clienteId != null
      ? await db
          .select()
          .from(direcciones)
          .where(eq(direcciones.clienteId, usuario.clienteId))
          .orderBy(desc(direcciones.esPrincipal), asc(direcciones.id))
      : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Confirmar pedido</h1>
      <CheckoutForm
        cliente={usuario ? { nombre: usuario.nombre } : null}
        direcciones={guardadas.map((d) => ({ id: d.id, texto: textoDireccion(d) }))}
        provincias={PROVINCIAS}
      />
    </div>
  );
}
