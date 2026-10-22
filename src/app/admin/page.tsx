import { requerirRol } from "@/lib/auth/dal";

export default async function GestionInicio() {
  const usuario = await requerirRol("admin", "vendedor");

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Hola, {usuario.nombre}</h1>
      <p className="text-neutral-600">Las pantallas de gestión llegan en el paso 2 del plan.</p>
    </section>
  );
}
