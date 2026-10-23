// "Bebidas sin Alcohol" -> "bebidas-sin-alcohol"
export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// Campo de texto opcional de un formulario: "" pasa a null.
export function textoOpcional(valor: FormDataEntryValue | null): string | null {
  const limpio = typeof valor === "string" ? valor.trim() : "";
  return limpio === "" ? null : limpio;
}
