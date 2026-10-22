import type { Rol } from "@/db/schema";

export type ItemMenu = { href: string; titulo: string; roles: Rol[] };

// Las secciones se irán habilitando en el paso 2 del plan.
export const MENU_GESTION: ItemMenu[] = [
  { href: "/admin", titulo: "Inicio", roles: ["admin", "vendedor"] },
  { href: "/admin/pedidos", titulo: "Pedidos y ventas", roles: ["admin", "vendedor"] },
  { href: "/admin/clientes", titulo: "Clientes", roles: ["admin", "vendedor"] },
  { href: "/admin/productos", titulo: "Productos", roles: ["admin", "vendedor"] },
  { href: "/admin/rubros", titulo: "Rubros", roles: ["admin"] },
  { href: "/admin/proveedores", titulo: "Proveedores", roles: ["admin"] },
  { href: "/admin/stock", titulo: "Stock", roles: ["admin"] },
  { href: "/admin/usuarios", titulo: "Usuarios", roles: ["admin"] },
];

export function menuPara(rol: Rol): ItemMenu[] {
  return MENU_GESTION.filter((item) => item.roles.includes(rol));
}
