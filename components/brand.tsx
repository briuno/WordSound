import { cn } from "@/lib/utils";

/**
 * Marca Sound Flow. O traco e o mesmo path dos SVGs da identidade,
 * com o gradiente azul -> violeta.
 */

const WAVE_PATH =
  "M 0 100 C 26 100, 30 38, 58 38 C 86 38, 90 162, 120 162 C 150 162, 154 62, 182 62 C 210 62, 214 124, 242 124";

// Id fixo de proposito. Todas as instancias definem o mesmo gradiente, entao
// ids repetidos resolvem para a primeira definicao e o resultado e identico.
// Um contador de modulo daria hydration mismatch entre servidor e cliente.
const GRADIENT_ID = "ws-sound-flow";

export function SoundWave({ className, title }: { className?: string; title?: string }) {
  const id = GRADIENT_ID;
  return (
    <svg
      viewBox="-16 20 274 160"
      className={cn("h-8 w-auto", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4F7CFF" />
          <stop offset="100%" stopColor="#7A5CFA" />
        </linearGradient>
      </defs>
      <path
        d={WAVE_PATH}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={28}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  withTagline = false,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <SoundWave className="h-8 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-2xl font-extrabold tracking-tight text-navy dark:text-white">
          WordSound
        </span>
        {withTagline ? (
          <span className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-text-muted">
            LEARN. LISTEN. GO FURTHER.
          </span>
        ) : null}
      </span>
    </span>
  );
}
