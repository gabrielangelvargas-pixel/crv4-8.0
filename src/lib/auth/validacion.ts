// Reglas de nombre de usuario y contraseña, compartidas por la gestión y la web.

export const LARGO_MINIMO_PASSWORD = 8;

export function errorNombreUsuario(nombre: string): string | null {
  if (nombre.length < 3) return "El usuario debe tener al menos 3 caracteres";
  if (nombre.length > 60) return "El usuario es muy largo";
  if (!/^[a-zA-Z0-9._+-]+$/.test(nombre)) return "El usuario solo admite letras, números, punto, guion y guion bajo";
  return null;
}

export function errorPassword(password: string, confirmacion: string): string | null {
  if (password.length < LARGO_MINIMO_PASSWORD) {
    return `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`;
  }
  if (password.length > 200) return "La contraseña es muy larga";
  if (password !== confirmacion) return "Las contraseñas no coinciden";
  return null;
}
