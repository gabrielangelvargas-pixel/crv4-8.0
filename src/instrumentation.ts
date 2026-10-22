// Next.js llama a register() una vez al arrancar el servidor. Aquí se
// actualiza la base, así funciona aunque el hosting no ejecute `npm start`.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { migrar } = await import("./db/migrar");
  try {
    await migrar();
  } catch (error) {
    // No se tumba el sitio: el error queda en el log del servidor.
    console.error("[migrar] No se pudo actualizar la base de datos:", error);
  }
}
