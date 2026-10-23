import { redirect } from "next/navigation";
import { Tarjeta } from "@/components/ui";
import { usuarioActual } from "@/lib/auth/dal";
import { destinoSeguro, inicioSegun } from "@/lib/auth/roles";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar · CRV4 Mayorista" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const usuario = await usuarioActual();
  if (usuario) redirect(destinoSeguro(next) ?? inicioSegun(usuario.accesoGestion));

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Ingresar</h1>
      <Tarjeta>
        <LoginForm next={destinoSeguro(next) ?? undefined} />
      </Tarjeta>
    </div>
  );
}
