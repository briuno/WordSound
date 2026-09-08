import { Check, Lightbulb, X } from "lucide-react";

import { ListeningBlock } from "@/components/listening-block";
import { Card } from "@/components/ui";
import type { StudentMedia } from "@/lib/queries";

/**
 * Renderizacao dos blocos de conteudo. Cada tipo le uma forma propria do jsonb
 * `lesson_blocks.content`, com fallback silencioso quando o campo nao existe.
 *
 * Um bloco de conteudo pode trazer, em qualquer combinacao:
 *
 *   rule         regra em uma frase, em destaque
 *   tables       paradigmas (verbo, plural, dezenas) como tabela de verdade
 *   contrast     erro tipico do falante de portugues x forma correta
 *   keyPoints    o que o aluno precisa levar para o exercicio
 *   paragraphs   o texto corrido de sempre
 *   tip          um lembrete curto no fim
 *
 * A ordem de leitura e fixa (regra, figura, tabela, contraste, pontos-chave,
 * paragrafos, dica) para o aluno aprender onde procurar cada coisa.
 */

interface VocabItem {
  word: string;
  translation: string;
  example?: string;
}

export interface LessonTable {
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface ContrastItem {
  wrong: string;
  right: string;
  why?: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/* ------------------------------------------------------------ primitivas */

export function RuleHighlight({ text }: { text: string }) {
  return (
    <p className="rounded-xl border-l-4 border-brand bg-brand/8 px-4 py-3 text-[15px]/relaxed font-semibold text-text">
      {text}
    </p>
  );
}

/**
 * Tabela de paradigma. O scroll horizontal fica no container e nao no corpo da
 * pagina: no celular uma tabela de quatro colunas nao cabe, e empurrar a tela
 * inteira para o lado quebraria a leitura do resto da licao.
 */
export function DataTable({ table }: { table: LessonTable }) {
  const columns = table.columns ?? [];
  const rows = table.rows ?? [];
  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <figure className="overflow-hidden rounded-xl border border-[var(--border)]">
      {table.caption ? (
        <figcaption className="border-b border-[var(--border)] bg-surface-muted/60 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-text-muted">
          {table.caption}
        </figcaption>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted">
              {columns.map((column, i) => (
                <th
                  key={i}
                  scope="col"
                  className="whitespace-nowrap px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-text-muted"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t border-[var(--border)]">
                {columns.map((_, c) => (
                  <td
                    key={c}
                    className={
                      c === 0
                        ? "px-3.5 py-2.5 align-top font-semibold text-navy dark:text-lilac"
                        : "px-3.5 py-2.5 align-top text-text"
                    }
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** Erro tipico de quem fala portugues, ao lado da forma correta. */
export function ContrastList({ items }: { items: ContrastItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="rounded-xl border border-[var(--border)] bg-surface-muted/50 p-3.5">
          <p className="flex items-start gap-2 text-sm text-error">
            <X size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span className="sr-only">Errado: </span>
            <span>{item.wrong}</span>
          </p>
          <p className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-success">
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span className="sr-only">Certo: </span>
            <span>{item.right}</span>
          </p>
          {item.why ? <p className="mt-1.5 pl-6 text-sm text-text-muted">{item.why}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function KeyPoints({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl bg-surface-muted/60 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Pontos-chave</p>
      <ul className="space-y-1.5">
        {items.map((point, i) => (
          <li key={i} className="flex gap-2.5 text-sm/relaxed text-text">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TipCallout({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-brand/25 bg-brand/6 px-4 py-3 text-sm/relaxed text-text">
      <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden />
      <span>{text}</span>
    </p>
  );
}

/**
 * Imagem do bloco (pagina ou ilustracao do livro).
 *
 * <img> cru de proposito: a URL vem assinada e expira, entao nao da para
 * passar pelo otimizador do next/image sem abrir o bucket privado ou cadastrar
 * um host com querystring variavel.
 */
export function BlockFigure({
  media,
  alt,
  caption,
}: {
  media: StudentMedia | undefined;
  alt: string;
  caption: string;
}) {
  if (!media || media.kind !== "image") return null;
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.url}
        alt={alt || media.title}
        loading="lazy"
        className="w-full rounded-xl border border-[var(--border)] bg-surface-muted"
      />
      {caption ? <figcaption className="mt-2 text-xs text-text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

/* ---------------------------------------------------------------- blocos */

export function ContentBlock({
  title,
  content,
  media,
}: {
  title: string | null;
  content: Record<string, unknown>;
  media?: StudentMedia;
}) {
  const rule = asString(content.rule);
  const paragraphs = asArray<string>(content.paragraphs);
  const tables = asArray<LessonTable>(content.tables);
  const contrast = asArray<ContrastItem>(content.contrast);
  const keyPoints = asArray<string>(content.keyPoints);
  const tip = asString(content.tip);
  const hasImage = media?.kind === "image";

  const isEmpty =
    !rule &&
    !tip &&
    !hasImage &&
    paragraphs.length === 0 &&
    tables.length === 0 &&
    contrast.length === 0 &&
    keyPoints.length === 0;
  if (isEmpty) return null;

  return (
    <Card>
      {title ? <h2 className="mb-3 text-lg font-bold">{title}</h2> : null}
      <div className="space-y-4">
        {rule ? <RuleHighlight text={rule} /> : null}
        <BlockFigure media={media} alt={asString(content.imageAlt)} caption={asString(content.imageCaption)} />
        {tables.map((table, i) => (
          <DataTable key={i} table={table} />
        ))}
        <ContrastList items={contrast} />
        <KeyPoints items={keyPoints} />
        {paragraphs.length > 0 ? (
          <div className="space-y-3 text-[15px]/relaxed text-text">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}
        {tip ? <TipCallout text={tip} /> : null}
      </div>
    </Card>
  );
}

export function VocabularyBlock({
  title,
  content,
  media,
}: {
  title: string | null;
  content: Record<string, unknown>;
  media?: StudentMedia;
}) {
  const items = asArray<VocabItem>(content.items);
  if (items.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{title ?? "Vocabulario"}</h2>
      {media?.kind === "image" ? (
        <div className="mb-4">
          <BlockFigure media={media} alt={asString(content.imageAlt)} caption={asString(content.imageCaption)} />
        </div>
      ) : null}
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

export function ReadingBlock({
  title,
  content,
  media,
}: {
  title: string | null;
  content: Record<string, unknown>;
  media?: StudentMedia;
}) {
  const text = asString(content.text);
  const vocabulary = asArray<VocabItem>(content.vocabulary);
  if (!text) return null;
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">{title ?? "Reading"}</h2>
      {media?.kind === "image" ? (
        <div className="mb-4">
          <BlockFigure media={media} alt={asString(content.imageAlt)} caption={asString(content.imageCaption)} />
        </div>
      ) : null}
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

/* --------------------------------------------------------------- consulta */

/** Um bloco so entra na consulta durante o exercicio se tiver o que consultar. */
export function hasRecap(content: Record<string, unknown>): boolean {
  return (
    asString(content.rule).length > 0 ||
    asArray<LessonTable>(content.tables).length > 0 ||
    asArray<string>(content.keyPoints).length > 0
  );
}

/**
 * Versao curta de um bloco, para o aluno reler a regra sem sair do exercicio.
 * Traz so o que se consulta: a regra, o paradigma e os pontos-chave. Texto
 * corrido e exemplo ficam de fora — quem esta respondendo quer a tabela.
 */
export function BlockRecap({ title, content }: { title: string | null; content: Record<string, unknown> }) {
  const rule = asString(content.rule);
  const tables = asArray<LessonTable>(content.tables);
  const keyPoints = asArray<string>(content.keyPoints);

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-bold">{title}</p> : null}
      {rule ? <RuleHighlight text={rule} /> : null}
      {tables.map((table, i) => (
        <DataTable key={i} table={table} />
      ))}
      <KeyPoints items={keyPoints} />
    </div>
  );
}

export function LessonContentBlock({
  type,
  title,
  content,
  media,
  questionCount,
}: {
  type: string;
  title: string | null;
  content: Record<string, unknown>;
  media?: StudentMedia;
  /** perguntas que vem logo depois deste bloco, para o listening avisar */
  questionCount?: number;
}) {
  switch (type) {
    case "CONTENT":
    case "GRAMMAR":
      return <ContentBlock title={title} content={content} media={media} />;
    case "VOCABULARY":
      return <VocabularyBlock title={title} content={content} media={media} />;
    case "READING":
      return <ReadingBlock title={title} content={content} media={media} />;
    case "LISTENING":
      return (
        <ListeningBlock title={title} content={content} media={media} questionCount={questionCount} />
      );
    default:
      return null;
  }
}
