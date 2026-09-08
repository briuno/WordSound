import { Card } from "@/components/ui";

/**
 * Renderizacao dos blocos de conteudo. Cada tipo le uma forma propria do jsonb
 * `lesson_blocks.content`, com fallback silencioso quando o campo nao existe.
 */

interface VocabItem {
  word: string;
  translation: string;
  example?: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function ContentBlock({ title, content }: { title: string | null; content: Record<string, unknown> }) {
  const paragraphs = asArray<string>(content.paragraphs);
  if (paragraphs.length === 0) return null;
  return (
    <Card>
      {title ? <h2 className="mb-3 text-lg font-bold">{title}</h2> : null}
      <div className="space-y-3 text-[15px]/relaxed text-text">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Card>
  );
}

export function VocabularyBlock({ title, content }: { title: string | null; content: Record<string, unknown> }) {
  const items = asArray<VocabItem>(content.items);
  if (items.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{title ?? "Vocabulario"}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.word} className="rounded-xl border border-[var(--border)] bg-surface-muted/60 p-3.5">
            <p className="font-bold text-navy dark:text-lilac">{item.word}</p>
            <p className="text-sm text-text-muted">{item.translation}</p>
            {item.example ? <p className="mt-1.5 text-sm italic text-text">{item.example}</p> : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ReadingBlock({ title, content }: { title: string | null; content: Record<string, unknown> }) {
  const text = typeof content.text === "string" ? content.text : "";
  const vocabulary = asArray<VocabItem>(content.vocabulary);
  if (!text) return null;
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">{title ?? "Reading"}</h2>
      <p className="text-[15px]/loose text-text">{text}</p>
      {vocabulary.length > 0 ? (
        <dl className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {vocabulary.map((v) => (
            <div key={v.word} className="rounded-[var(--radius-pill)] bg-surface-muted px-3 py-1.5 text-sm">
              <dt className="inline font-semibold">{v.word}</dt>
              <dd className="inline text-text-muted"> · {v.translation}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Card>
  );
}

export function LessonContentBlock({
  type,
  title,
  content,
}: {
  type: string;
  title: string | null;
  content: Record<string, unknown>;
}) {
  switch (type) {
    case "CONTENT":
    case "GRAMMAR":
      return <ContentBlock title={title} content={content} />;
    case "VOCABULARY":
      return <VocabularyBlock title={title} content={content} />;
    case "READING":
      return <ReadingBlock title={title} content={content} />;
    default:
      return null;
  }
}
