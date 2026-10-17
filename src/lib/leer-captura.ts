import Anthropic from "@anthropic-ai/sdk";

export type CifrasLeidas = { views: number | null; accounts: number | null; interactions: number | null };

const INSTRUCCIONES = `You read screenshots of Instagram story insights (the statistics screen of one story) and return its figures.

Return three numbers, as integers without separators:
- views: the story's views ("Views", "Vues", "Visualizaciones"; older screens call it "Impressions").
- accounts: accounts reached ("Accounts reached", "Comptes atteints", "Cuentas alcanzadas").
- interactions: interactions ("Interactions", "Interacciones").

Expand abbreviations: "1,2 k" or "1.2K" is 1200, "3 M" is 3000000. Read numbers in the screenshot's own locale (in French "1 234" and "1,2" mean 1234 and 1.2). If a figure is not visible, or the image is not an Instagram insights screen, return null for it. Never guess a number that is not on the screen.`;

const NULO_O_ENTERO = { anyOf: [{ type: "integer" }, { type: "null" }] };
const SCHEMA = {
  type: "object",
  properties: { views: NULO_O_ENTERO, accounts: NULO_O_ENTERO, interactions: NULO_O_ENTERO },
  required: ["views", "accounts", "interactions"],
  additionalProperties: false,
};

const entero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);

/**
 * Las cifras de una story leídas de su captura de las estadísticas de
 * Instagram (Natalia, 2026-10-17: que no haya que teclearlas). Lo que no se
 * lea vuelve en null y el storyteller lo escribe a mano; sin clave de la API,
 * o si falla, devuelve null entero.
 */
export async function leerCaptura(
  imagenBase64: string,
  tipo: "image/jpeg" | "image/png" | "image/webp"
): Promise<CifrasLeidas | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      // Si un clasificador rechaza la petición, la API la repite en otro modelo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Leer tres cifras de una pantalla: poca reflexión basta.
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: INSTRUCCIONES,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: tipo, data: imagenBase64 } },
            { type: "text", text: "Read the figures of this story." },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
    const bloque = response.content.find((b) => b.type === "text");
    if (!bloque || bloque.type !== "text") return null;
    const datos = JSON.parse(bloque.text) as Record<string, unknown>;
    return { views: entero(datos.views), accounts: entero(datos.accounts), interactions: entero(datos.interactions) };
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error(`Captura: error ${err.status} de la API:`, err.message);
    else console.error("Captura no leída:", err);
    return null;
  }
}
