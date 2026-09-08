import type { ServerExercise } from "./types";

/**
 * Converte a resposta bruta do aluno em texto legivel.
 *
 * O objeto cru ({ optionId: 7 }, { pairs: [[0,1]] }) nao diz nada para um
 * modelo de linguagem nem para uma tela de correcao. Aqui ele vira a frase
 * que a pessoa efetivamente montou.
 */
export function describeAnswer(exercise: ServerExercise, answer: unknown): string {
  if (answer == null || typeof answer !== "object") return "(sem resposta)";
  const value = answer as Record<string, unknown>;

  if (typeof value.optionId === "number") {
    const option = exercise.options.find((o) => o.id === value.optionId);
    return option?.text ?? "(alternativa desconhecida)";
  }

  if (typeof value.value === "boolean") return value.value ? "True" : "False";
  if (typeof value.value === "string") return value.value.trim() || "(em branco)";

  if (Array.isArray(value.values)) {
    const template = typeof exercise.prompt.template === "string" ? exercise.prompt.template : "";
    if (template) {
      let i = 0;
      return template.replace(/\{\{\d+\}\}/g, () => String(value.values as string[])[i++] ?? "___");
    }
    return (value.values as string[]).join(", ");
  }

  if (Array.isArray(value.order)) return (value.order as string[]).join(" ");

  if (Array.isArray(value.pairs)) {
    const left = Array.isArray(exercise.prompt.left) ? (exercise.prompt.left as string[]) : [];
    const right = Array.isArray(exercise.prompt.right) ? (exercise.prompt.right as string[]) : [];
    return (value.pairs as [number, number][])
      .map(([l, r]) => `${left[l] ?? l} = ${right[r] ?? r}`)
      .join("; ");
  }

  return "(sem resposta)";
}
