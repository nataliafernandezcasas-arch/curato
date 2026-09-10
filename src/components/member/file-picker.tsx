"use client";

import { useId } from "react";

/**
 * Elegir un archivo, dentro de la app.
 *
 * El patrón de siempre (un input con `display:none` y un `.click()` desde
 * JavaScript) funciona en un navegador de escritorio y falla dentro del
 * WebView de iOS: el selector no llega a abrirse y el botón parece muerto. Sin
 * error, sin aviso, sin nada.
 *
 * Aquí el input sigue en el documento y es el propio `label` quien lo abre, que
 * es la asociación nativa del navegador y no necesita JavaScript. El input se
 * esconde con tamaño y opacidad, nunca con `display:none`, porque lo que no se
 * pinta tampoco se puede pulsar.
 */
export function FilePicker({
  onFiles,
  accept = "image/*",
  multiple = false,
  disabled = false,
  className,
  children,
}: {
  onFiles: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();

  return (
    <>
      <label
        htmlFor={id}
        aria-disabled={disabled}
        className={`${className ?? ""} ${disabled ? "pointer-events-none opacity-45" : "cursor-pointer"}`}
      >
        {children}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
        className="absolute h-px w-px overflow-hidden opacity-0"
        style={{ clip: "rect(0 0 0 0)" }}
      />
    </>
  );
}
