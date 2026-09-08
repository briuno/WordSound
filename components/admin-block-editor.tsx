"use client";

import * as React from "react";

import { updateBlock, type ActionResult } from "@/app/admin/actions";
import type { ContrastItem, LessonTable } from "@/components/lesson-blocks";
import { Button, ErrorMessage, Field, Input } from "@/components/ui";

/**
 * Editor de conteudo dos blocos.
 *
 * Cada tipo tem uma forma propria no jsonb. O admin digita texto simples e a
 * conversao acontece aqui, nos dois sentidos, para ninguem precisar escrever
 * JSON na mao. O separador e sempre o mesmo: barra vertical entre colunas,
 * linha em branco entre blocos.
 */

interface VocabItem {
  word: string;
  translation: string;
  example?: string;
}

function Textarea({ rows = 6, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      {...props}
      className="w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-2.5 font-mono text-sm text-text placeholder:text-text-muted/70"
    />
  );
}

function MediaSelect({
  id,
  value,
  options,
  emptyLabel,
}: {
  id: string;
  value: number | null;
  options: { id: number; title: string }[];
  emptyLabel: string;
}) {
  return (
    <select
      id={id}
      name="mediaId"
      defaultValue={value ? String(value) : ""}
      className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface px-3 text-text"
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.title}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------- conversoes ------------------------------- */

function cells(line: string): string[] {
  return line.split("|").map((s) => s.trim());
}

function vocabToText(items: VocabItem[]): string {
  return items.map((i) => [i.word, i.translation, i.example].filter(Boolean).join(" | ")).join("\n");
}

function textToVocab(text: string): VocabItem[] {
  return text
    .split("\n")
    .map(cells)
    .filter((parts) => parts[0])
    .map(([word, translation, example]) => ({
      word,
      translation: translation ?? "",
      ...(example ? { example } : {}),
    }));
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function tablesToText(tables: LessonTable[]): string {
  return tables
    .map((table) =>
      [
        table.caption ? `= ${table.caption}` : null,
        table.columns.join(" | "),
        ...table.rows.map((row) => row.join(" | ")),
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    )
    .join("\n\n");
}

/**
 * Cada tabela e um paragrafo do textarea. Dentro dele, uma linha iniciada por
 * "=" e a legenda, a primeira linha restante e o cabecalho e o resto sao as
 * linhas de dados.
 */
function textToTables(text: string): LessonTable[] {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => {
      let caption: string | undefined;
      const body: string[] = [];
      for (const line of lines(chunk)) {
        if (line.startsWith("=")) caption = line.slice(1).trim();
        else body.push(line);
      }
      if (body.length < 2) return null;
      const columns = cells(body[0]);
      const rows = body.slice(1).map((line) => {
        const row = cells(line);
        // completa a linha curta para a tabela nao sair torta
        while (row.length < columns.length) row.push("");
        return row.slice(0, columns.length);
      });
      return { ...(caption ? { caption } : {}), columns, rows };
    })
    .filter((table): table is LessonTable => table !== null);
}

function contrastToText(items: ContrastItem[]): string {
  return items.map((i) => [i.wrong, i.right, i.why].filter(Boolean).join(" | ")).join("\n");
}

function textToContrast(text: string): ContrastItem[] {
  return text
    .split("\n")
    .map(cells)
    .filter((parts) => parts[0] && parts[1])
    .map(([wrong, right, why]) => ({ wrong, right, ...(why ? { why } : {}) }));
}

function buildContent(blockType: string, form: HTMLFormElement): Record<string, unknown> {
  const value = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";

  // campos da figura, comuns a todo bloco que aceita imagem
  const figure = () => {
    const alt = value("imageAlt").trim();
    const caption = value("imageCaption").trim();
    return { ...(alt ? { imageAlt: alt } : {}), ...(caption ? { imageCaption: caption } : {}) };
  };

  switch (blockType) {
    case "CONTENT":
    case "GRAMMAR": {
      const rule = value("rule").trim();
      const tip = value("tip").trim();
      return {
        ...(rule ? { rule } : {}),
        // linha em branco separa paragrafos
        paragraphs: value("paragraphs")
          .split(/\n\s*\n/)
          .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
          .filter(Boolean),
        tables: textToTables(value("tables")),
        contrast: textToContrast(value("contrast")),
        keyPoints: lines(value("keyPoints")),
        ...(tip ? { tip } : {}),
        ...figure(),
      };
    }
    case "VOCABULARY":
      return { items: textToVocab(value("items")), ...figure() };
    case "READING":
      return {
        text: value("text").trim(),
        vocabulary: textToVocab(value("vocabulary")).map(({ word, translation }) => ({ word, translation })),
        ...figure(),
      };
    case "LISTENING":
      return { instructions: value("instructions").trim() };
    default:
      return {};
  }
}

/* --------------------------------- editor --------------------------------- */

export function BlockContentEditor({
  blockId,
  lessonId,
  blockType,
  title,
  content,
  mediaId,
  audios,
  images,
}: {
  blockId: number;
  lessonId: number;
  blockType: string;
  title: string | null;
  content: Record<string, unknown>;
  mediaId: number | null;
  audios: { id: number; title: string }[];
  images: { id: number; title: string }[];
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const newTitle = (form.elements.namedItem("title") as HTMLInputElement)?.value ?? "";
    const rawMedia = (form.elements.namedItem("mediaId") as HTMLSelectElement | null)?.value;
    const newMediaId = rawMedia ? Number(rawMedia) : null;

    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result: ActionResult = await updateBlock(
        blockId,
        lessonId,
        newTitle,
        buildContent(blockType, form),
        newMediaId,
      );
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  const paragraphs = (content.paragraphs as string[] | undefined) ?? [];
  const items = (content.items as VocabItem[] | undefined) ?? [];
  const readingVocab = (content.vocabulary as VocabItem[] | undefined) ?? [];
  const tables = (content.tables as LessonTable[] | undefined) ?? [];
  const contrast = (content.contrast as ContrastItem[] | undefined) ?? [];
  const keyPoints = (content.keyPoints as string[] | undefined) ?? [];

  const isText = blockType === "CONTENT" || blockType === "GRAMMAR";
  const acceptsImage = isText || blockType === "VOCABULARY" || blockType === "READING";

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titulo do bloco" htmlFor={`block-title-${blockId}`}>
        <Input id={`block-title-${blockId}`} name="title" defaultValue={title ?? ""} />
      </Field>

      {isText ? (
        <>
          <Field
            label="Regra em destaque"
            htmlFor={`rule-${blockId}`}
            hint="Uma frase. E a primeira coisa que o aluno le, e o que ele reve durante o exercicio."
          >
            <Input id={`rule-${blockId}`} name="rule" defaultValue={String(content.rule ?? "")} />
          </Field>

          <Field
            label="Tabelas"
            htmlFor={`tables-${blockId}`}
            hint={'Linha em branco separa tabelas. "= legenda" no topo, depois o cabecalho, depois as linhas. Colunas separadas por |'}
          >
            <Textarea
              id={`tables-${blockId}`}
              name="tables"
              rows={8}
              defaultValue={tablesToText(tables)}
              placeholder={"= Afirmativo\nPessoa | Verbo | Exemplo\nI | am | I am a student.\nhe / she / it | is | She is a nurse."}
            />
          </Field>

          <Field
            label="Erros comuns"
            htmlFor={`contrast-${blockId}`}
            hint="Uma por linha: errado | certo | por que"
          >
            <Textarea
              id={`contrast-${blockId}`}
              name="contrast"
              rows={4}
              defaultValue={contrastToText(contrast)}
              placeholder={"I have 20 years old. | I am 20 years old. | idade em ingles usa to be"}
            />
          </Field>

          <Field label="Pontos-chave" htmlFor={`keyPoints-${blockId}`} hint="Um por linha.">
            <Textarea id={`keyPoints-${blockId}`} name="keyPoints" rows={4} defaultValue={keyPoints.join("\n")} />
          </Field>

          <Field
            label="Paragrafos"
            htmlFor={`paragraphs-${blockId}`}
            hint="Deixe uma linha em branco entre paragrafos."
          >
            <Textarea id={`paragraphs-${blockId}`} name="paragraphs" defaultValue={paragraphs.join("\n\n")} />
          </Field>

          <Field label="Dica final" htmlFor={`tip-${blockId}`}>
            <Input id={`tip-${blockId}`} name="tip" defaultValue={String(content.tip ?? "")} />
          </Field>
        </>
      ) : null}

      {blockType === "VOCABULARY" ? (
        <Field
          label="Palavras"
          htmlFor={`items-${blockId}`}
          hint="Uma por linha: palavra | traducao | exemplo"
        >
          <Textarea
            id={`items-${blockId}`}
            name="items"
            defaultValue={vocabToText(items)}
            placeholder={"teacher | professor | The teacher is here."}
          />
        </Field>
      ) : null}

      {blockType === "READING" ? (
        <>
          <Field label="Texto" htmlFor={`text-${blockId}`}>
            <Textarea id={`text-${blockId}`} name="text" rows={8} defaultValue={String(content.text ?? "")} />
          </Field>
          <Field
            label="Vocabulario de apoio"
            htmlFor={`vocabulary-${blockId}`}
            hint="Uma por linha: palavra | traducao"
          >
            <Textarea
              id={`vocabulary-${blockId}`}
              name="vocabulary"
              rows={4}
              defaultValue={vocabToText(readingVocab)}
            />
          </Field>
        </>
      ) : null}

      {acceptsImage ? (
        <>
          <Field
            label="Imagem"
            htmlFor={`media-${blockId}`}
            hint="Suba antes em Midia. Uma imagem por bloco."
          >
            <MediaSelect id={`media-${blockId}`} value={mediaId} options={images} emptyLabel="Sem imagem" />
          </Field>
          <Field
            label="Texto alternativo"
            htmlFor={`imageAlt-${blockId}`}
            hint="Descreve a imagem para quem usa leitor de tela. Vazio usa o titulo da midia."
          >
            <Input id={`imageAlt-${blockId}`} name="imageAlt" defaultValue={String(content.imageAlt ?? "")} />
          </Field>
          <Field label="Legenda" htmlFor={`imageCaption-${blockId}`}>
            <Input
              id={`imageCaption-${blockId}`}
              name="imageCaption"
              defaultValue={String(content.imageCaption ?? "")}
            />
          </Field>
        </>
      ) : null}

      {blockType === "LISTENING" ? (
        <>
          <Field label="Instrucoes" htmlFor={`instructions-${blockId}`}>
            <Input
              id={`instructions-${blockId}`}
              name="instructions"
              defaultValue={String(content.instructions ?? "")}
              placeholder="Ouca e responda as perguntas abaixo."
            />
          </Field>
          <Field label="Audio" htmlFor={`media-${blockId}`}>
            <MediaSelect id={`media-${blockId}`} value={mediaId} options={audios} emptyLabel="Sem audio" />
          </Field>
        </>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Salvando…" : "Salvar bloco"}
        </Button>
        {saved ? (
          <span role="status" className="text-sm font-semibold text-success">
            Salvo.
          </span>
        ) : null}
      </div>
    </form>
  );
}
