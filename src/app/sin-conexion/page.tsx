import { BotonReintentar } from "./boton-reintentar";

export const metadata = { title: "Sin conexión · CRV4 Mayorista" };

// Se guarda en el celular al instalar la app y se muestra cuando no hay internet.
export default function SinConexionPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-lg font-bold tracking-tight text-marca">
        CRV4 <span className="font-medium text-texto">Mayorista</span>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Sin conexión</h1>
      <p className="max-w-sm text-sm text-texto-suave">
        No pudimos conectarnos a internet. Revisa la señal o el wifi y vuelve a intentarlo.
      </p>
      <BotonReintentar />
    </main>
  );
}
