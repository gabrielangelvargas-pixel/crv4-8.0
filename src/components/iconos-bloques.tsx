import type { SVGProps } from "react";
import {
  faBoxesStacked,
  faClock,
  faComments,
  faCreditCard,
  faGift,
  faHandshake,
  faHeadset,
  faLocationDot,
  faPhone,
  faShieldHalved,
  faStar,
  faStore,
  faTags,
  faTruckFast,
  faWallet,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { ClaveIcono } from "@/lib/iconos-bloque";

// Íconos de Font Awesome (sólidos) para los bloques de información de la portada.
const ICONOS: Record<ClaveIcono, IconDefinition> = {
  cajas: faBoxesStacked,
  etiqueta: faTags,
  billetera: faWallet,
  camion: faTruckFast,
  tarjeta: faCreditCard,
  atencion: faHeadset,
  consultas: faComments,
  acuerdo: faHandshake,
  tienda: faStore,
  reloj: faClock,
  escudo: faShieldHalved,
  telefono: faPhone,
  ubicacion: faLocationDot,
  regalo: faGift,
  estrella: faStar,
};

// Se dibuja el SVG directamente: no hace falta la hoja de estilos de Font Awesome.
export function IconoBloque({ icono, ...props }: { icono: string } & SVGProps<SVGSVGElement>) {
  const [ancho, alto, , , trazo] = (ICONOS[icono as ClaveIcono] ?? faStar).icon;
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} fill="currentColor" aria-hidden="true" {...props}>
      {(Array.isArray(trazo) ? trazo : [trazo]).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
