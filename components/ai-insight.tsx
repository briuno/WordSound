"use client";

import { Check, Lightbulb, Sparkles, X } from "lucide-react";
import * as React from "react";

import { submitRetryAnswer } from "@/app/(app)/actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface InsightPayload {
  insight_id: number | null;
  explanation: string;
  rule: string;
  example: string;
  retry_question: string | null;
  retry_options: string[];
}

/**
 * WordSound Insight (spec 25).
 *
 * A resposta certa da pergunta de reforco nunca chega aqui: o endpoint devolve
 * a pergunta e as alternativas, e a correcao volta ao servidor pela action.
 */
export function AIInsight({
  exerciseId,
  studentAnswer,
  onClose,
}: {
  exerciseId: number;
  studentAnswer: unknown;
  onClose?: () => void;
}) {
  const [insight, setInsight] = React.useState<InsightPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [picked, setPicked] = React.useState<number | null>(null);
  const [result, setResult] = React.useState<{ isCorrect: boolean; correctOption: string } | null>(null);
  const [checking, startChecking] = React.useTransition();

  // O componente e montado com key={exerciseId}, entao cada exercicio comeca
  // com loading=true vindo do estado inicial. Nao ha por que reatribuir aqui.
  React.useEffect(() => {
    let active = true;
    fetch("/api/ai/explain-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise_id: exerciseId, student_answer: studentAnswer }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!active) return;
        if (!r.ok) {
          setError(data.error ?? "Nao consegui gerar a explicacao agora.");
          return;
        }
        setInsight(data as InsightPayload);
      })
      .catch(() => active && setError("Falha de rede ao buscar a explicacao."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // studentAnswer e um objeto novo a cada render do pai; o exercicio identifica
    // a solicitacao, entao so ele entra nas dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  function check() {
    if (picked === null || !insight?.insight_id) return;
    startChecking(async () => {
      const r = await submitRetryAnswer(insight.insight_id!, picked);
      if (r.error) {
        setError(r.error);
        return;
      }
      setResult({ isCorrect: r.isCorrect, correctOption: r.correctOption });
    });
  }

  return (
    <section
      aria-label="WordSound Insight"
      className="rounded-[var(--radius-card)] border-2 border-purple/40 bg-purple/6 p-5"
    >
      <h3 className="flex items-center gap-2 font-extrabold text-purple">
        <Sparkles size={18} aria-hidden />
        WordSound Insight
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar explicacao"
            className="ml-auto grid size-7 place-items-center rounded-full text-text-muted hover:bg-surface-muted"
          >
            <X size={15} aria-hidden />
          </button>
        ) : null}
      </h3>

      {loading ? (
        <div className="mt-4 space-y-2" role="status" aria-live="polite">
          <p className="text-sm text-text-muted">Analisando sua resposta…</p>
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-surface-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-surface-muted" />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}

      {insight ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm/relaxed text-text">{insight.explanation}</p>

          {insight.rule ? (
            <div className="rounded-xl bg-surface p-3.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
                <Lightbulb size={13} aria-hidden />
                A regra
              </p>
              <p className="text-sm/relaxed text-text">{insight.rule}</p>
            </div>
          ) : null}

          {insight.example ? (
            <p className="text-sm italic text-text">
              <span className="not-italic font-semibold text-text-muted">Exemplo: </span>
              {insight.example}
            </p>
          ) : null}

          {insight.retry_question && insight.retry_options.length > 0 ? (
            <div className="border-t border-purple/25 pt-4">
              <p className="mb-3 font-semibold text-text">{insight.retry_question}</p>

              <div role="radiogroup" aria-label={insight.retry_question} className="space-y-2">
                {insight.retry_options.map((option, i) => {
                  const chosen = picked === i;
                  const revealed = result !== null;
                  const isRight = revealed && option === result.correctOption;
                  const isWrongPick = revealed && chosen && !result.isCorrect;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      disabled={revealed || checking}
                      onClick={() => setPicked(i)}
                      className={cn(
                        "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors",
                        isRight && "border-success bg-success/10",
                        isWrongPick && "border-error bg-error/10",
                        !revealed && chosen && "border-purple bg-purple/10",
                        !revealed && !chosen && "border-[var(--border)] bg-surface hover:border-purple/50",
                        revealed && !isRight && !isWrongPick && "border-[var(--border)] bg-surface opacity-60",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {result ? (
                <p
                  role="status"
                  className={cn(
                    "mt-3 flex items-center gap-2 text-sm font-bold",
                    result.isCorrect ? "text-success" : "text-error",
                  )}
                >
                  {result.isCorrect ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden />}
                  {result.isCorrect ? "Isso mesmo. Voce entendeu a regra." : `A correta era: ${result.correctOption}`}
                </p>
              ) : (
                <Button
                  className="mt-3 w-full"
                  onClick={check}
                  disabled={picked === null || checking || !insight.insight_id}
                >
                  {checking ? "Verificando…" : "Tentar novamente"}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
