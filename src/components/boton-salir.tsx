import { salir } from "@/app/login/actions";

export function BotonSalir() {
  return (
    <form action={salir}>
      <button className="text-sm underline underline-offset-4">Salir</button>
    </form>
  );
}
