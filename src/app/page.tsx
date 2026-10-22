import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="flex items-center justify-between">
        <span className="text-xl font-semibold">CRV4</span>
        <Link href="/login" className="text-sm underline underline-offset-4">
          Ingresar
        </Link>
      </header>
      <h1 className="text-3xl font-semibold">Catálogo</h1>
      <p className="text-neutral-600">El catálogo público llega en el paso 3 del plan.</p>
    </main>
  );
}
