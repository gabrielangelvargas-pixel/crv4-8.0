import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth/dal";
import { destinoSeguro, inicioSegunRol } from "@/lib/auth/roles";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar · CRV4" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const usuario = await usuarioActual();
  if (usuario) redirect(destinoSeguro(next) ?? inicioSegunRol(usuario.rol));

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <LoginForm next={destinoSeguro(next) ?? undefined} />
    </main>
  );
}
