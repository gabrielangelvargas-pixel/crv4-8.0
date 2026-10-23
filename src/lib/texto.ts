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

// "(011) 15-4567-8901" -> "0111545678901": se guarda sin espacios ni separadores
// para poder compararlo y usarlo como usuario de la web. Null si no parece un teléfono.
export function normalizarTelefono(texto: string): string | null {
  const limpio = texto.trim().replace(/[\s\-().]/g, "");
  return /^\+?\d{6,20}$/.test(limpio) ? limpio : null;
}
