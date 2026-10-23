import { tienePermiso, type PerfilAcceso } from "@/lib/auth/permisos";
import type { Modulo } from "@/lib/auth/permisos-catalogo";

export type ItemMenu = { href: string; titulo: string; modulo?: Modulo };

// Cada sección aparece si el rol puede "ver" su módulo.
export const MENU_GESTION: ItemMenu[] = [
  { href: "/admin", titulo: "Inicio" },
  { href: "/admin/pedidos", titulo: "Pedidos y ventas", modulo: "pedidos" },
  { href: "/admin/clientes", titulo: "Clientes", modulo: "clientes" },
  { href: "/admin/productos", titulo: "Productos", modulo: "productos" },
  { href: "/admin/rubros", titulo: "Rubros", modulo: "rubros" },
  { href: "/admin/proveedores", titulo: "Proveedores", modulo: "proveedores" },
  { href: "/admin/stock", titulo: "Stock", modulo: "stock" },
  { href: "/admin/portada", titulo: "Portada de la web", modulo: "portada" },
  { href: "/admin/usuarios", titulo: "Usuarios", modulo: "usuarios" },
  { href: "/admin/roles", titulo: "Roles y permisos", modulo: "roles" },
];

export function menuPara(perfil: PerfilAcceso): ItemMenu[] {
  return MENU_GESTION.filter((item) => !item.modulo || tienePermiso(perfil, item.modulo, "ver"));
}
