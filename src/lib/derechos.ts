// Los avisos del fin de la exclusividad. Lógica pura: la tarea horaria solo
// pregunta aquí qué toca con cada reserva con contenido.
//
// La casa tiene 90 días de derechos exclusivos desde que el storyteller sube
// sus fotos a Curato (content_rights_expires_at, fijado en la primera subida).
// Después conserva una licencia no exclusiva (CGU, artículo 20), así que el
// aviso informa de que acaba la exclusividad, no pide borrar nada.

const DIA = 24 * 60 * 60 * 1000;

/** El primer aviso sale cuando quedan estos días. */
export const AVISO_ANTES_D = 7;
/**
 * Pasado esto ya no se avisa del fin: al desplegar, las reservas vencidas hace
 * tiempo no deben recibir una ráfaga de avisos atrasados.
 */
export const OLVIDO_D = 3;

export type FaseDerechos = "7d" | "fin";

export type QueTocaDerechos = {
  /** El aviso que hay que enviar ahora, si hay alguno. */
  enviar: FaseDerechos | null;
  /**
   * Marcar el aviso de los siete días sin enviarlo: ya venció la exclusividad
   * y decir "quedan siete días" sería falso.
   */
  saltarSieteDias: boolean;
};

const NADA: QueTocaDerechos = { enviar: null, saltarSieteDias: false };

/**
 * Qué hacer con una reserva cuyas fotos tienen fecha de fin de exclusividad.
 *
 *   · en los siete días antes del fin: avisar a la casa, una vez;
 *   · el día del fin (y hasta tres días después): avisar de que acabó, una vez,
 *     y dar por hecho el de los siete días si no salió a tiempo.
 */
export function queTocaDerechos(
  r: {
    content_rights_expires_at: string | null;
    aviso_derechos_7d_at: string | null;
    aviso_derechos_fin_at: string | null;
  },
  ahora: Date = new Date()
): QueTocaDerechos {
  if (!r.content_rights_expires_at) return NADA;
  const fin = new Date(r.content_rights_expires_at).getTime();
  if (Number.isNaN(fin)) return NADA;
  const t = ahora.getTime();

  if (t >= fin) {
    if (t - fin > OLVIDO_D * DIA) return NADA;
    return { enviar: r.aviso_derechos_fin_at ? null : "fin", saltarSieteDias: !r.aviso_derechos_7d_at };
  }
  if (t >= fin - AVISO_ANTES_D * DIA) {
    return { enviar: r.aviso_derechos_7d_at ? null : "7d", saltarSieteDias: false };
  }
  return NADA;
}
