import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { consumidorFinal } from "@/lib/gestion/pedidos";
import { VentaForm } from "./venta-form";

export const metadata = { title: "Nueva venta · CRV4" };

export default async function NuevaVentaPage() {
  const usuario = await requerirPermiso("pedidos", "crear");

  return (
    <>
      <EncabezadoPagina titulo="Nueva venta en el local" />
      <VentaForm consumidorFinal={await consumidorFinal()} puedeCrearClientes={tienePermiso(usuario, "clientes", "crear")} />
    </>
  );
}
