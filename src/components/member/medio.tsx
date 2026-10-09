"use client";

import { esVideo } from "@/lib/medio";

/**
 * Una foto o un vídeo de una visita, en su hueco. El vídeo se ve en bucle y
 * sin sonido, como en Instagram, con un ▶ en la esquina para que se sepa que
 * es un vídeo; al tocarlo se abre entero.
 */
export function Medio({ url, className = "" }: { url: string; className?: string }) {
  if (esVideo(url)) {
    return (
      <span className="relative block h-full w-full">
        <video src={url} className={`h-full w-full object-cover ${className}`} muted playsInline loop autoPlay preload="metadata" />
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-[11px] text-white"
        >
          ▶
        </span>
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`h-full w-full object-cover ${className}`} />;
}
