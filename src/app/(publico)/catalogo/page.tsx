import { Tarjeta } from "@/components/ui";

export const metadata = { title: "Catálogo · CRV4 Mayorista" };

export default function CatalogoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
      <Tarjeta className="text-sm text-texto-suave">Esta sección llega en el paso 3 del plan.</Tarjeta>
    </div>
  );
}
