import { BotonSalir } from "@/components/boton-salir";
import { requerirRol } from "@/lib/auth/dal";

export const metadata = { title: "Mi cuenta · CRV4" };

export default async function CuentaPage() {
  const usuario = await requerirRol("cliente");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      <p>Hola, {usuario.nombre}. Aquí verás tus pedidos y direcciones.</p>
      <BotonSalir />
    </main>
  );
}
