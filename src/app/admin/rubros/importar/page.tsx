import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { ImportarWoo } from "./importar-woo";

export const metadata = { title: "Importar rubros · CRV4" };

export default async function ImportarRubrosPage() {
  await requerirPermiso("rubros", "crear");
  return (
    <>
      <EncabezadoPagina
        titulo="Importar desde WooCommerce"
        descripcion="Trae las categorías de productos de tu tienda WooCommerce como rubros y subrubros, con sus imágenes."
      />
      <ImportarWoo />
    </>
  );
}
