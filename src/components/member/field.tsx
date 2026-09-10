"use client";

import { useId } from "react";

/**
 * Un campo.
 *
 * Sin recuadro. En reposo no lleva línea; al enfocarlo aparece una en
 * champagne por debajo, y esa aparición es toda la señal que hace falta.
 *
 * El valor va a 17 px por una razón concreta: por debajo de 16 px el WebView de
 * iOS hace zoom al enfocar el campo, y ese zoom es el origen del desplazamiento
 * horizontal del que se queja todo el mundo.
 */
export function Field({
  label,
  error,
  hint,
  className,
  id,
  ...input
}: {
  label: React.ReactNode;
  /** El motivo, bajo el campo, sin icono y sin recuadro. */
  error?: string;
  hint?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-bloque block text-capitale uppercase tracking-capitale text-accent"
      >
        {label}
      </label>

      <input
        {...input}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary transition-colors duration-200 ease-curato outline-none placeholder:text-text-muted focus:border-accent"
      />

      {hint && !error && (
        <p className="mt-etiqueta text-legende text-text-secondary">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="mt-etiqueta text-legende text-copper-vif">
          {error}
        </p>
      )}
    </div>
  );
}
