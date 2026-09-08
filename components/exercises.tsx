"use client";

import * as React from "react";

import type { ExerciseType, StudentExercise } from "@/lib/exercises/types";
import { Input } from "@/components/ui";
import { cn, shuffle } from "@/lib/utils";

/**
 * UI dos exercicios. Espelha o registry de correcao de lib/exercises/registry.ts:
 * la mora como corrigir, aqui como responder. Um tipo novo entra nos dois lugares
 * e o resto do sistema nao muda.
 */

export interface ExerciseInputProps {
  exercise: StudentExercise;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}

/* --------------------------------------------------------- opcoes clicaveis */

function OptionButton({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border-2 px-4 py-3.5 text-left font-medium transition-colors",
        "disabled:cursor-not-allowed",
        selected
          ? "border-brand bg-brand/8 text-text"
          : "border-[var(--border)] bg-surface text-text hover:border-brand/45",
      )}
    >
      {children}
    </button>
  );
}

function MultipleChoice({ exercise, value, onChange, disabled }: ExerciseInputProps) {
  const selected = (value as { optionId?: number } | null)?.optionId;
  return (
    <div role="radiogroup" aria-label={exercise.question} className="space-y-2.5">
      {exercise.options.map((o) => (
        <OptionButton
          key={o.id}
          selected={selected === o.id}
          disabled={disabled}
          onClick={() => onChange({ optionId: o.id })}
        >
          {o.text}
        </OptionButton>
      ))}
    </div>
  );
}

function TrueFalse({ exercise, value, onChange, disabled }: ExerciseInputProps) {
  const selected = (value as { value?: boolean } | null)?.value;
  return (
    <div role="radiogroup" aria-label={exercise.question} className="grid grid-cols-2 gap-2.5">
      {[
        { label: "True", v: true },
        { label: "False", v: false },
      ].map(({ label, v }) => (
        <OptionButton key={label} selected={selected === v} disabled={disabled} onClick={() => onChange({ value: v })}>
          <span className="block text-center">{label}</span>
        </OptionButton>
      ))}
    </div>
  );
}

/** Template "My friends {{0}} students." vira texto com input inline. */
function FillBlank({ exercise, value, onChange, disabled }: ExerciseInputProps) {
  const template = String((exercise.prompt as { template?: unknown }).template ?? "{{0}}");
  const parts = template.split(/\{\{\d+\}\}/g);
  const blanks = Math.max(1, parts.length - 1);
  const values = (value as { values?: string[] } | null)?.values ?? Array(blanks).fill("");

  function setAt(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    onChange({ values: next });
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-3 text-lg leading-relaxed">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span>{part}</span>
          {i < blanks ? (
            <Input
              aria-label={`Lacuna ${i + 1}`}
              value={values[i] ?? ""}
              onChange={(e) => setAt(i, e.target.value)}
              disabled={disabled}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="inline-block h-10 w-32 border-b-2 border-brand/60 bg-surface-muted text-center"
            />
          ) : null}
        </React.Fragment>
      ))}
    </p>
  );
}

function ShortAnswer({ value, onChange, disabled }: ExerciseInputProps) {
  return (
    <Input
      aria-label="Sua resposta"
      value={((value as { value?: string } | null)?.value as string) ?? ""}
      onChange={(e) => onChange({ value: e.target.value })}
      disabled={disabled}
      placeholder="Escreva em ingles"
      autoComplete="off"
      autoCapitalize="none"
      className="h-12 text-lg"
    />
  );
}

/** Banco de palavras: clique para montar a frase, clique de novo para tirar. */
function OrderWords({ exercise, value, onChange, disabled }: ExerciseInputProps) {
  const chosen = React.useMemo(() => (value as { order?: string[] } | null)?.order ?? [], [value]);

  // embaralha de forma estavel pelo id, para nao trocar a cada re-render.
  // o fallback [] fica dentro do memo: fora dele criaria array novo a cada
  // render e a memoizacao nao valeria nada.
  const bank = React.useMemo(() => {
    const tokens = ((exercise.prompt as { tokens?: unknown }).tokens as string[] | undefined) ?? [];
    return shuffle(tokens, exercise.id);
  }, [exercise.prompt, exercise.id]);

  const remaining = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of chosen) counts.set(t, (counts.get(t) ?? 0) + 1);
    return bank.filter((t) => {
      const n = counts.get(t) ?? 0;
      if (n > 0) {
        counts.set(t, n - 1);
        return false;
      }
      return true;
    });
  }, [bank, chosen]);

  return (
    <div className="space-y-4">
      <div
        className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] p-3"
        aria-label="Sua frase"
      >
        {chosen.length === 0 ? (
          <span className="px-1 text-sm text-text-muted">Toque nas palavras abaixo</span>
        ) : (
          chosen.map((t, i) => (
            <button
              key={`${t}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ order: chosen.filter((_, j) => j !== i) })}
              className="rounded-[var(--radius-pill)] bg-brand/12 px-3.5 py-2 font-semibold text-brand"
            >
              {t}
            </button>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Palavras disponiveis">
        {remaining.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ order: [...chosen, t] })}
            className="rounded-[var(--radius-pill)] border-2 border-[var(--border)] bg-surface px-3.5 py-2 font-semibold hover:border-brand/45 disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Associacao: seleciona a esquerda, depois a direita. */
function Matching({ exercise, value, onChange, disabled }: ExerciseInputProps) {
  const left = ((exercise.prompt as { left?: unknown }).left as string[] | undefined) ?? [];
  const right = ((exercise.prompt as { right?: unknown }).right as string[] | undefined) ?? [];
  const pairs = (value as { pairs?: [number, number][] } | null)?.pairs ?? [];
  const [activeLeft, setActiveLeft] = React.useState<number | null>(null);

  const leftPaired = new Map(pairs.map(([l, r]) => [l, r]));
  const rightPaired = new Set(pairs.map(([, r]) => r));

  function pickLeft(i: number) {
    if (leftPaired.has(i)) {
      onChange({ pairs: pairs.filter(([l]) => l !== i) });
      setActiveLeft(null);
      return;
    }
    setActiveLeft(activeLeft === i ? null : i);
  }

  function pickRight(j: number) {
    if (rightPaired.has(j)) {
      onChange({ pairs: pairs.filter(([, r]) => r !== j) });
      return;
    }
    if (activeLeft === null) return;
    onChange({ pairs: [...pairs, [activeLeft, j] as [number, number]] });
    setActiveLeft(null);
  }

  const chip = (paired: boolean, active: boolean) =>
    cn(
      "w-full rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors",
      paired
        ? "border-success/60 bg-success/10 text-text"
        : active
          ? "border-brand bg-brand/10"
          : "border-[var(--border)] bg-surface hover:border-brand/45",
    );

  return (
    <div className="grid grid-cols-2 gap-3">
      <ul className="space-y-2">
        {left.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => pickLeft(i)}
              aria-pressed={activeLeft === i}
              className={chip(leftPaired.has(i), activeLeft === i)}
            >
              {item}
              {leftPaired.has(i) ? (
                <span className="ml-1.5 text-text-muted">→ {right[leftPaired.get(i)!]}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <ul className="space-y-2">
        {right.map((item, j) => (
          <li key={j}>
            <button
              type="button"
              disabled={disabled || (activeLeft === null && !rightPaired.has(j))}
              onClick={() => pickRight(j)}
              className={cn(chip(rightPaired.has(j), false), "disabled:opacity-55")}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Classificar em categorias. Compartilha o corretor com MATCHING, mas a
 * interacao e outra: varias palavras caem na mesma categoria, entao a coluna
 * da direita nunca "esgota". A palavra sai do banco quando e classificada e
 * volta quando o aluno clica nela dentro da categoria.
 */
function CategorySort({ exercise, value, onChange, disabled }: ExerciseInputProps) {
  const items = ((exercise.prompt as { left?: unknown }).left as string[] | undefined) ?? [];
  const categories = ((exercise.prompt as { right?: unknown }).right as string[] | undefined) ?? [];
  const pairs = (value as { pairs?: [number, number][] } | null)?.pairs ?? [];
  const [active, setActive] = React.useState<number | null>(null);

  const placed = new Map(pairs.map(([i, c]) => [i, c]));
  const pool = items.map((_, i) => i).filter((i) => !placed.has(i));

  function pickItem(i: number) {
    setActive(active === i ? null : i);
  }

  function dropInto(c: number) {
    if (active === null) return;
    onChange({ pairs: [...pairs.filter(([i]) => i !== active), [active, c] as [number, number]] });
    setActive(null);
  }

  function takeBack(i: number) {
    onChange({ pairs: pairs.filter(([j]) => j !== i) });
    setActive(null);
  }

  const chip = (state: "idle" | "active" | "placed") =>
    cn(
      "rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors",
      state === "placed"
        ? "border-success/60 bg-success/10 text-text"
        : state === "active"
          ? "border-brand bg-brand/10"
          : "border-[var(--border)] bg-surface hover:border-brand/45",
    );

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-2" aria-label="Palavras para classificar">
        {pool.map((i) => (
          <li key={i}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => pickItem(i)}
              aria-pressed={active === i}
              className={chip(active === i ? "active" : "idle")}
            >
              {items[i]}
            </button>
          </li>
        ))}
        {pool.length === 0 ? (
          <li className="text-sm text-text-muted">Todas as palavras foram classificadas.</li>
        ) : null}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category, c) => {
          const inside = pairs.filter(([, k]) => k === c).map(([i]) => i);
          return (
            <div key={c} className="rounded-2xl border-2 border-[var(--border)] bg-surface-muted p-3">
              <button
                type="button"
                disabled={disabled || active === null}
                onClick={() => dropInto(c)}
                className={cn(
                  "w-full rounded-xl px-2 py-1.5 text-left text-sm font-bold uppercase tracking-wide",
                  active === null ? "text-text-muted" : "bg-brand/10 text-text",
                )}
              >
                {category}
              </button>
              <ul className="mt-2 flex flex-wrap gap-2">
                {inside.map((i) => (
                  <li key={i}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => takeBack(i)}
                      className={chip("placed")}
                    >
                      {items[i]}
                    </button>
                  </li>
                ))}
                {inside.length === 0 ? <li className="py-1 text-sm text-text-muted">vazio</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ registry */

const INPUTS: Partial<Record<ExerciseType, React.ComponentType<ExerciseInputProps>>> = {
  MULTIPLE_CHOICE: MultipleChoice,
  READING_QUESTION: MultipleChoice,
  LISTENING_MULTIPLE_CHOICE: MultipleChoice,
  CHOICE_INLINE: MultipleChoice,
  TRUE_FALSE: TrueFalse,
  FILL_BLANK: FillBlank,
  LISTENING_FILL_BLANK: FillBlank,
  FORM_FILL: FillBlank,
  SHORT_ANSWER: ShortAnswer,
  CORRECT_SENTENCE: ShortAnswer,
  ORDER_WORDS: OrderWords,
  ORDER_SENTENCES: OrderWords,
  MATCHING: Matching,
  CATEGORY_SORT: CategorySort,
};

/** true quando o tipo tem UI implementada nesta entrega. */
export function isExerciseRenderable(type: string): boolean {
  return type in INPUTS;
}

/** Uma resposta "vazia" nao deve poder ser enviada. */
export function hasAnswer(type: ExerciseType, value: unknown): boolean {
  if (value == null) return false;
  const v = value as Record<string, unknown>;
  if ("optionId" in v) return typeof v.optionId === "number";
  if ("value" in v) return typeof v.value === "boolean" || String(v.value ?? "").trim() !== "";
  if ("values" in v) return Array.isArray(v.values) && v.values.every((x) => String(x ?? "").trim() !== "");
  if ("order" in v) return Array.isArray(v.order) && v.order.length > 0;
  if ("pairs" in v) return Array.isArray(v.pairs) && v.pairs.length > 0;
  return false;
}

export function ExerciseInput(props: ExerciseInputProps) {
  const Component = INPUTS[props.exercise.type];
  if (!Component) {
    return (
      <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-muted">
        Este tipo de exercicio ({props.exercise.type}) ainda nao tem interface nesta versao.
      </p>
    );
  }
  return <Component {...props} />;
}
