import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { crearPortada } from "../actions";
import { PortadaForm } from "../portada-form";

export const metadata = { title: "Nueva imagen de portada · CRV4" };

export default async function NuevaPortadaPage() {
  await requerirPermiso("portada", "crear");
  return (
    <>
      <EncabezadoPagina titulo="Nueva imagen de portada" />
      <PortadaForm accion={crearPortada} />
    </>
  );
}
