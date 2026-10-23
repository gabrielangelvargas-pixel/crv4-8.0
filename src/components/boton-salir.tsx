import { salir } from "@/app/(publico)/login/actions";

export function BotonSalir({ className }: { className?: string }) {
  return (
    <form action={salir}>
      <button className={className ?? "text-sm underline underline-offset-4"}>Salir</button>
    </form>
  );
}
