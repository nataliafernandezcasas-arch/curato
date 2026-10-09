/** ¿Es un vídeo? Por la extensión del archivo, antes de la firma del enlace. */
export function esVideo(url: string): boolean {
  return /\.(mp4|mov|m4v|webm)$/i.test(url.split("?")[0]);
}

/** Lo más largo que puede durar un vídeo de una visita, en segundos. */
export const VIDEO_MAX_S = 30;
