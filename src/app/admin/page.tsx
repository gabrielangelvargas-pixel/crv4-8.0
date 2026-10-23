import { requerirGestion } from "@/lib/auth/dal";

export default async function GestionInicio({ searchParams }: PageProps<"/admin">) {
  const usuario = await requerirGestion();
  const sinPermiso = (await searchParams)["sin-permiso"] !== undefined;

  return (
    <section className="flex flex-col gap-2">
      {sinPermiso && (
        <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu rol no tiene permiso para esa sección.
        </p>
      )}
      <h1 className="text-2xl font-semibold">Hola, {usuario.nombre}</h1>
      <p className="text-neutral-600">Las pantallas de gestión llegan en el paso 2 del plan.</p>
    </section>
  );
}
