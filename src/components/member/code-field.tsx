"use client";

import { useId } from "react";

/**
 * El código de seis cifras.
 *
 * A 28 px y centrado, porque en esta pantalla el código es el contenido, no un
 * dato más de un formulario. Solo números: en un móvil abre el teclado
 * numérico, y pegar un código con espacios o guiones sigue funcionando porque
 * se limpia al escribir.
 */
export function CodeField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-bloque block text-capitale uppercase tracking-capitale text-accent">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        maxLength={6}
        placeholder="000000"
        className="w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-center text-[28px] font-light tracking-capitale text-text-primary transition-colors duration-200 ease-curato outline-none placeholder:text-text-muted/40 focus:border-accent"
      />
      {hint && <p className="mt-etiqueta text-legende text-text-secondary">{hint}</p>}
    </div>
  );
}
