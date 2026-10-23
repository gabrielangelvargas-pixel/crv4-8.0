import { BotonEnlace, Tarjeta } from "@/components/ui";

const DESTACADOS = [
  { titulo: "Catálogo por rubros", texto: "Encuentra los productos filtrando por rubro y subrubro." },
  { titulo: "Pedidos online", texto: "Arma tu carrito y confirma el pedido desde el celular." },
  { titulo: "Retiro o envío", texto: "Retira en el local o recíbelo en la dirección que elijas." },
];

export default function Inicio() {
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <section className="rounded-2xl bg-marca px-5 py-10 text-white md:px-12 md:py-16">
        <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-5xl">Todo para tu negocio, al por mayor</h1>
        <p className="mt-3 max-w-lg text-base text-blue-100 md:text-lg">
          Consulta el catálogo, arma tu pedido y nosotros lo preparamos.
        </p>
        <BotonEnlace href="/catalogo" variante="secundario" className="mt-6 w-full sm:w-auto">
          Ver catálogo
        </BotonEnlace>
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        {DESTACADOS.map((d) => (
          <Tarjeta key={d.titulo}>
            <h2 className="font-semibold">{d.titulo}</h2>
            <p className="mt-1 text-sm text-texto-suave">{d.texto}</p>
          </Tarjeta>
        ))}
      </section>
    </div>
  );
}
