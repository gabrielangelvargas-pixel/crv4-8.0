import { PasswordForm } from "@/components/password-form";
import { EncabezadoPagina } from "@/components/ui";
import { requerirGestion } from "@/lib/auth/dal";
import { cambiarMiPassword } from "./actions";

export const metadata = { title: "Mi cuenta · CRV4" };

export default async function MiCuentaPage() {
  const usuario = await requerirGestion();

  return (
    <>
      <EncabezadoPagina
        titulo="Mi cuenta"
        descripcion={`${usuario.nombre} · usuario ${usuario.nombreUsuario} · ${usuario.rol.nombre}`}
      />
      <PasswordForm accion={cambiarMiPassword} pedirActual titulo="Cambiar mi contraseña" />
    </>
  );
}
