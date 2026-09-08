import { PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ReviewSession } from "@/components/review-session";
import { buttonClasses, Card } from "@/components/ui";
import { getReviewMedia, getReviewQueue } from "@/lib/review";

export const metadata: Metadata = { title: "Revisao" };

export default async function ReviewPage() {
  const queue = await getReviewQueue();

  if (queue.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Revisao</h1>
        <Card className="text-center">
          <PartyPopper size={28} aria-hidden className="mx-auto text-success" />
          <h2 className="mt-3 text-lg font-bold">Nada para revisar</h2>
          <p className="mt-1 text-sm text-text-muted">
            Todos os exercicios que voce errou ja foram corrigidos depois. Quando errar algum novo, ele
            aparece aqui.
          </p>
          <Link href="/app" className={buttonClasses("primary", "lg", "mt-6 w-full")}>
            Voltar para a trilha
          </Link>
        </Card>
      </div>
    );
  }

  const media = await getReviewMedia(queue.items);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Revisao</h1>
        <p className="mt-1 text-sm text-text-muted">
          {queue.items.length} exercicio(s) esperando. Os que voce mais errou vem primeiro. Acertar tira o
          exercicio da fila.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Por licao</p>
          <ul className="space-y-1 text-sm">
            {queue.byLesson.map((row) => (
              <li key={row.lessonId} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">{row.title}</span>
                <span className="shrink-0 font-bold tabular-nums text-text-muted">{row.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Por tipo</p>
          <ul className="space-y-1 text-sm">
            {queue.byType.map((row) => (
              <li key={row.type} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">{row.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-text-muted">{row.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ReviewSession items={queue.items} media={media} />
    </div>
  );
}
