import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes do Tailwind resolvendo conflitos (a ultima vence). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Good morning" / "Good afternoon" / "Good evening" conforme a hora local. */
export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Embaralha uma copia do array. Usado para apresentar tokens fora de ordem. */
export function shuffle<T>(items: readonly T[], seed = 1): T[] {
  const out = [...items];
  let random = seed;
  for (let i = out.length - 1; i > 0; i--) {
    random = (random * 9301 + 49297) % 233280;
    const j = Math.floor((random / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
