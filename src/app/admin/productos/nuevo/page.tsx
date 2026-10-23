import { BotonEnlace, EncabezadoPagina, Tarjeta } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { opcionesProveedor } from "@/lib/gestion/productos";
import { arbolDeRubros } from "@/lib/gestion/rubros";
import { crearProducto } from "../actions";
import { ProductoForm } from "../producto-form";

export const metadata = { title: "Nuevo producto · CRV4" };

export default async function NuevoProductoPage() {
  const usuario = await requerirPermiso("productos", "crear");
  const verProveedores = tienePermiso(usuario, "proveedores", "ver");
  const [rubros, proveedores] = await Promise.all([
    arbolDeRubros(),
    verProveedores ? opcionesProveedor() : Promise.resolve(null),
  ]);
  const conSubrubros = rubros.filter((r) => r.subrubros.length > 0);

  return (
    <>
      <EncabezadoPagina titulo="Nuevo producto" />
      {conSubrubros.length === 0 ? (
        <Tarjeta className="flex flex-col items-start gap-3 sm:max-w-2xl">
          <p className="text-sm">Antes de cargar productos necesitas al menos un subrubro.</p>
          {tienePermiso(usuario, "rubros", "crear") && <BotonEnlace href="/admin/rubros">Ir a Rubros</BotonEnlace>}
        </Tarjeta>
      ) : (
        <ProductoForm
          accion={crearProducto}
          rubros={conSubrubros}
          proveedores={proveedores?.filter((p) => p.activo) ?? null}
          verCosto={usuario.accesoTotal}
        />
      )}
    </>
  );
}
