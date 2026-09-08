"use client";

import * as React from "react";

import { saveExercise } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin-controls";
import { Field, Input } from "@/components/ui";
import { EXERCISE_REGISTRY } from "@/lib/exercises/registry";
import { EXERCISE_TYPES, type ExerciseType } from "@/lib/exercises/types";

/**
 * Editor de exercicio (spec 47): escolhe-se o tipo e os campos especificos
 * aparecem. O formato de prompt e answer_key e montado no servidor, em
 * app/admin/actions.ts, para o admin nunca precisar entender o JSON.
 */

const OPTION_TYPES: ExerciseType[] = [
  "MULTIPLE_CHOICE",
  "READING_QUESTION",
  "LISTENING_MULTIPLE_CHOICE",
  "CHOICE_INLINE",
];

export interface ExerciseDraft {
  id: number;
  type: ExerciseType;
  question: string;
  instruction: string | null;
  explanation: string | null;
  difficulty: number;
  xpReward: number;
  mediaId: number | null;
  prompt: Record<string, unknown>;
  answerKey: Record<string, unknown>;
  options: { text: string; isCorrect: boolean }[];
}

/**
 * A coluna da direita e guardada embaralhada, com os pares apontando para as
 * posicoes novas. Para editar, desfazemos isso e mostramos cada par alinhado
 * com a sua linha da esquerda, que e como o admin digitou originalmente.
 */
function alignedRight(draft?: ExerciseDraft): string[] {
  if (!draft) return [];
  const right = (draft.prompt?.right as string[] | undefined) ?? [];
  const pairs = (draft.answerKey?.pairs as [number, number][] | undefined) ?? [];
  const left = (draft.prompt?.left as string[] | undefined) ?? [];
  if (right.length === 0 || pairs.length === 0) return [];

  const byLeft = new Map(pairs.map(([l, r]) => [l, r]));
  return left.map((_, i) => right[byLeft.get(i) ?? i] ?? "");
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-2.5 text-text placeholder:text-text-muted/70"
    />
  );
}

export function ExerciseEditor({
  blockId,
  lessonId,
  audios,
  draft,
  onSaved,
}: {
  blockId: number;
  lessonId: number;
  audios: { id: number; title: string }[];
  draft?: ExerciseDraft;
  onSaved?: () => void;
}) {
  const [type, setType] = React.useState<ExerciseType>(draft?.type ?? "MULTIPLE_CHOICE");
  const usesOptions = OPTION_TYPES.includes(type);
  const needsMedia = EXERCISE_REGISTRY[type]?.needsMedia ?? false;

  const existingOptions = draft?.options ?? [];
  const correctIndex = existingOptions.findIndex((o) => o.isCorrect);
  const blanks = (draft?.answerKey?.blanks as { accepted: string[] }[] | undefined)?.[0]?.accepted ?? [];
  const accepted = (draft?.answerKey?.accepted as string[] | undefined) ?? blanks;

  return (
    <AdminForm
      action={saveExercise.bind(null, blockId, lessonId, draft?.id ?? null)}
      submitLabel={draft ? "Salvar exercicio" : "Adicionar exercicio"}
      onSaved={onSaved}
    >
      <Field label="Tipo" htmlFor={`type-${draft?.id ?? "new"}`}>
        <select
          id={`type-${draft?.id ?? "new"}`}
          name="exerciseType"
          value={type}
          onChange={(e) => setType(e.target.value as ExerciseType)}
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface px-3 text-text"
        >
          {EXERCISE_TYPES.map((t) => (
            <option key={t} value={t}>
              {EXERCISE_REGISTRY[t].label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Comando" htmlFor={`instruction-${draft?.id ?? "new"}`} hint="Aparece acima do enunciado.">
        <Input
          id={`instruction-${draft?.id ?? "new"}`}
          name="instruction"
          defaultValue={draft?.instruction ?? ""}
          placeholder="Choose the correct answer."
        />
      </Field>

      <Field label="Enunciado" htmlFor={`question-${draft?.id ?? "new"}`}>
        <Input
          id={`question-${draft?.id ?? "new"}`}
          name="question"
          required
          defaultValue={draft?.question ?? ""}
          placeholder="My friends ___ students."
        />
      </Field>

      {/* ------------------------------ campos por tipo ------------------------------ */}

      {usesOptions ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-semibold">Alternativas</legend>
          <p className="mb-2 text-xs text-text-muted">Marque o circulo da alternativa correta.</p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctOption"
                value={i}
                defaultChecked={correctIndex === i || (correctIndex === -1 && i === 0)}
                aria-label={`Alternativa ${i + 1} e a correta`}
                className="size-4 shrink-0 accent-[var(--color-brand)]"
              />
              <Input
                name="option"
                defaultValue={existingOptions[i]?.text ?? ""}
                placeholder={i < 2 ? `Alternativa ${i + 1} (obrigatoria)` : `Alternativa ${i + 1} (opcional)`}
              />
            </div>
          ))}
        </fieldset>
      ) : null}

      {type === "TRUE_FALSE" ? (
        <Field label="Resposta correta" htmlFor={`tf-${draft?.id ?? "new"}`}>
          <select
            id={`tf-${draft?.id ?? "new"}`}
            name="trueFalse"
            defaultValue={String(draft?.answerKey?.value === true)}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface px-3 text-text"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </Field>
      ) : null}

      {["FILL_BLANK", "LISTENING_FILL_BLANK", "FORM_FILL"].includes(type) ? (
        <>
          <Field
            label="Frase com a lacuna"
            htmlFor={`template-${draft?.id ?? "new"}`}
            hint="Use {{0}} onde fica a lacuna."
          >
            <Input
              id={`template-${draft?.id ?? "new"}`}
              name="template"
              defaultValue={String(draft?.prompt?.template ?? "")}
              placeholder="My friends {{0}} students."
            />
          </Field>
          <Field
            label="Respostas aceitas"
            htmlFor={`accepted-${draft?.id ?? "new"}`}
            hint="Uma por linha. Maiusculas e acentos sao ignorados na correcao."
          >
            <Textarea id={`accepted-${draft?.id ?? "new"}`} name="accepted" defaultValue={accepted.join("\n")} />
          </Field>
        </>
      ) : null}

      {["SHORT_ANSWER", "CORRECT_SENTENCE"].includes(type) ? (
        <Field
          label="Respostas aceitas"
          htmlFor={`accepted-${draft?.id ?? "new"}`}
          hint="Uma por linha. Vale a pena listar as variacoes naturais."
        >
          <Textarea id={`accepted-${draft?.id ?? "new"}`} name="accepted" defaultValue={accepted.join("\n")} />
        </Field>
      ) : null}

      {["ORDER_WORDS", "ORDER_SENTENCES"].includes(type) ? (
        <Field
          label="Ordem correta"
          htmlFor={`order-${draft?.id ?? "new"}`}
          hint="Separe por espaco. O aluno recebe embaralhado."
        >
          <Input
            id={`order-${draft?.id ?? "new"}`}
            name="order"
            defaultValue={((draft?.answerKey?.order as string[] | undefined) ?? []).join(" ")}
            placeholder="My name is Ana"
          />
        </Field>
      ) : null}

      {["MATCHING", "CATEGORY_SORT"].includes(type) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Coluna da esquerda" htmlFor={`left-${draft?.id ?? "new"}`} hint="Um item por linha.">
            <Textarea
              id={`left-${draft?.id ?? "new"}`}
              name="left"
              defaultValue={((draft?.prompt?.left as string[] | undefined) ?? []).join("\n")}
            />
          </Field>
          <Field
            label="Par correspondente"
            htmlFor={`right-${draft?.id ?? "new"}`}
            hint="Mesma linha da esquerda. A ordem e embaralhada ao salvar."
          >
            <Textarea
              id={`right-${draft?.id ?? "new"}`}
              name="right"
              defaultValue={alignedRight(draft).join("\n")}
            />
          </Field>
        </div>
      ) : null}

      {needsMedia ? (
        <Field label="Audio" htmlFor={`media-${draft?.id ?? "new"}`}>
          <select
            id={`media-${draft?.id ?? "new"}`}
            name="mediaId"
            defaultValue={draft?.mediaId ? String(draft.mediaId) : ""}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface px-3 text-text"
          >
            <option value="">Sem audio</option>
            {audios.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field
        label="Explicacao"
        htmlFor={`explanation-${draft?.id ?? "new"}`}
        hint="Mostrada depois da resposta. Serve de base para o WordSound Insight."
      >
        <Textarea
          id={`explanation-${draft?.id ?? "new"}`}
          name="explanation"
          defaultValue={draft?.explanation ?? ""}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dificuldade" htmlFor={`difficulty-${draft?.id ?? "new"}`} hint="De 1 a 5.">
          <Input
            id={`difficulty-${draft?.id ?? "new"}`}
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={draft?.difficulty ?? 1}
          />
        </Field>
        <Field label="XP" htmlFor={`xp-${draft?.id ?? "new"}`}>
          <Input
            id={`xp-${draft?.id ?? "new"}`}
            name="xpReward"
            type="number"
            min={0}
            defaultValue={draft?.xpReward ?? 10}
          />
        </Field>
      </div>
    </AdminForm>
  );
}
