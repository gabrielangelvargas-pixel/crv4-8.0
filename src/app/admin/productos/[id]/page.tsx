import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerProducto, opcionesProveedor } from "@/lib/gestion/productos";
import { arbolDeRubros } from "@/lib/gestion/rubros";
import { urlImagen } from "@/lib/imagenes";
import { formatearCantidad, importeParaCampo } from "@/lib/numeros";
import { editarProducto, eliminarProducto } from "../actions";
import { ProductoForm } from "../producto-form";

export const metadata = { title: "Producto · CRV4" };

export default async function ProductoPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  const usuario = await requerirPermiso("productos", "ver");
  const id = Number((await params).id);
  const producto = Number.isInteger(id) ? await obtenerProducto(id) : null;
  if (!producto) notFound();

  const verProveedores = tienePermiso(usuario, "proveedores", "ver");
  const verCosto = usuario.accesoTotal;
  const [rubros, proveedores] = await Promise.all([
    arbolDeRubros(),
    verProveedores ? opcionesProveedor() : Promise.resolve(null),
  ]);
  const enUso = (await searchParams)["en-uso"] !== undefined;

  return (
    <>
      <EncabezadoPagina titulo={producto.nombre} />
      <ProductoForm
        accion={editarProducto.bind(null, producto.id)}
        rubros={rubros.filter((r) => r.subrubros.length > 0)}
        // Un proveedor inactivo sigue apareciendo si es el del producto.
        proveedores={proveedores?.filter((p) => p.activo || p.id === producto.proveedorId) ?? null}
        verCosto={verCosto}
        inicial={{
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          rubroId: producto.rubroId,
          proveedorId: verProveedores ? producto.proveedorId : null,
          tipoVariante: producto.tipoVariante,
          visibleWeb: producto.visibleWeb,
          destacado: producto.destacado,
          activo: producto.activo,
        }}
        variantesIniciales={producto.variantes.map((v) => ({
          id: v.id,
          valor: v.valor,
          codigo: v.codigo,
          // El costo no viaja al navegador de quien no lo puede ver.
          codigoProveedor: verProveedores ? (v.codigoProveedor ?? "") : "",
          precioCosto: verCosto ? importeParaCampo(v.precioCosto) : "",
          precioVenta: importeParaCampo(v.precioVenta),
          precioOferta: importeParaCampo(v.precioOferta),
          activo: v.activo,
          esPrincipal: v.esPrincipal,
          stock: formatearCantidad(v.stockActual),
          // La foto vieja guardada en el producto es la de la variante principal.
          imagenActual: urlImagen(v.imagen ?? (v.esPrincipal ? producto.imagen : null), producto.actualizadoEn),
        }))}
        soloLectura={!tienePermiso(usuario, "productos", "editar")}
      />
      {tienePermiso(usuario, "productos", "eliminar") && (
        <form
          action={eliminarProducto.bind(null, producto.id)}
          className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 lg:max-w-4xl"
        >
          {enUso && (
            <p role="alert" className="text-sm text-peligro">
              No se puede eliminar porque ya tiene ventas o movimientos de stock. Puedes desactivarlo.
            </p>
          )}
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">
            Eliminar producto
          </button>
        </form>
      )}
    </>
  );
}
