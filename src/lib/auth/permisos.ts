import { permiso, type Accion, type Modulo, type Permiso } from "./permisos-catalogo";

export type PerfilAcceso = {
  accesoTotal: boolean;
  accesoGestion: boolean;
  permisos: readonly Permiso[];
};

export function tienePermiso(perfil: PerfilAcceso, modulo: Modulo, accion: Accion): boolean {
  if (!perfil.accesoGestion) return false;
  if (perfil.accesoTotal) return true;
  return perfil.permisos.includes(permiso(modulo, accion));
}
