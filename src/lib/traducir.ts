import Anthropic from "@anthropic-ai/sdk";

export type Idioma = "fr" | "en" | "es";

const NOMBRE: Record<Idioma, string> = { fr: "French", en: "English", es: "Spanish" };

const INSTRUCCIONES = `You translate the descriptions that Paris venues (restaurants, hotels, spas, beauty studios) write about themselves for Curato, an invitation-only club that connects them with content creators.

Translate faithfully into each requested language, in the register a well-written guide to Paris would use: warm, precise, unhurried, never salesy. Keep proper names, dish names and addresses as they are. Do not add, remove or embellish anything, and do not explain the translation. Return only the translations.`;

/**
 * La descripción de una casa, traducida a los idiomas que falten.
 *
 * La casa escribe en un idioma y el resto lo pone Claude al guardar; luego
 * puede retocarlo. Si no hay clave de la API, o la traducción falla, devuelve
 * null y la descripción se guarda sin traducir: traducir ayuda, no bloquea.
 */
export async function traducirDescripcion(
  texto: string,
  desde: Idioma,
  hacia: Idioma[]
): Promise<Partial<Record<Idioma, string>> | null> {
  const destinos = hacia.filter((l) => l !== desde);
  if (!texto.trim() || destinos.length === 0) return {};
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic();
  const schema = {
    type: "object",
    properties: Object.fromEntries(destinos.map((l) => [l, { type: "string" }])),
    required: destinos,
    additionalProperties: false,
  };

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      // Si un clasificador rechaza la petición, la API la repite en otro modelo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Una traducción corta: poca reflexión basta.
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: INSTRUCCIONES,
      messages: [
        {
          role: "user",
          content: `Translate this ${NOMBRE[desde]} description into: ${destinos.map((l) => `${NOMBRE[l]} (key "${l}")`).join(", ")}.\n\n<description>\n${texto}\n</description>`,
        },
      ],
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;

    const bloque = response.content.find((b) => b.type === "text");
    if (!bloque || bloque.type !== "text") return null;
    const datos = JSON.parse(bloque.text) as Record<string, unknown>;
    const out: Partial<Record<Idioma, string>> = {};
    for (const l of destinos) if (typeof datos[l] === "string" && datos[l]) out[l] = (datos[l] as string).trim();
    return out;
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error(`Traducción: error ${err.status} de la API:`, err.message);
    else console.error("Traducción fallida:", err);
    return null;
  }
}
