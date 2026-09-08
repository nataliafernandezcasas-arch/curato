/**
 * La solidez de una contraseña.
 *
 * La misma pieza que la barra del crédito: una línea de 1 px y una palabra al
 * lado. Ni candados, ni semáforos de tres bolas, ni un recuadro de consejos.
 *
 * El mínimo real son 8 caracteres, así que por debajo de eso no hay nada que
 * medir: lo que falta lo dice el propio campo.
 */
export function strengthOf(password: string): 0 | 1 | 2 | 3 {
  if (password.length < 8) return 0;
  let score = 1;
  if (password.length >= 12) score++;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score >= 4 ? 3 : score >= 3 ? 2 : 1;
}

export function StrengthMeter({
  password,
  words,
}: {
  password: string;
  words: { weak: string; fair: string; strong: string };
}) {
  if (!password) return null;

  const level = strengthOf(password);
  if (level === 0) return null;

  const shown = {
    1: { label: words.weak, width: "33%", tone: "text-copper", bar: "bg-copper" },
    2: { label: words.fair, width: "66%", tone: "text-accent", bar: "bg-accent" },
    3: { label: words.strong, width: "100%", tone: "text-sauge-text", bar: "bg-sauge-text" },
  }[level];

  return (
    <div className="mt-bloque grid grid-cols-[minmax(0,1fr)_auto] items-center gap-fila">
      <div className="h-px bg-border">
        <div
          className={`h-full ${shown.bar} transition-[width] duration-500 ease-curato`}
          style={{ width: shown.width }}
        />
      </div>
      <span className={`text-capitale uppercase tracking-capitale ${shown.tone}`}>{shown.label}</span>
    </div>
  );
}
