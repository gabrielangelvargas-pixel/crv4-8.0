import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION } from "@/lib/auth/roles";

// Chequeo rápido: sin cookie de sesión no se entra a las zonas privadas.
// La validación real (sesión vigente y permisos) la hacen las funciones de
// src/lib/auth/dal.ts en cada página.
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE_SESION)) return NextResponse.next();

  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
