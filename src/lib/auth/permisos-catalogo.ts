// Catálogo fijo de permisos: cada pantalla y acción de gestión verifica uno
// de estos pares. Qué rol tiene cada par se configura en la tabla rol_permisos.
export const MODULOS = [
  "rubros",
  "proveedores",
  "productos",
  "stock",
  "clientes",
  "pedidos",
  "usuarios",
  "roles",
  "portada",
] as const;
export type Modulo = (typeof MODULOS)[number];

export const ACCIONES = ["ver", "crear", "editar", "eliminar"] as const;
export type Accion = (typeof ACCIONES)[number];

export const NOMBRE_MODULO: Record<Modulo, string> = {
  rubros: "Rubros",
  proveedores: "Proveedores",
  productos: "Productos",
  stock: "Stock",
  clientes: "Clientes",
  pedidos: "Pedidos y ventas",
  usuarios: "Usuarios",
  roles: "Roles y permisos",
  portada: "Portada de la web",
};

export type Permiso = `${Modulo}:${Accion}`;

export function permiso(modulo: Modulo, accion: Accion): Permiso {
  return `${modulo}:${accion}`;
}
