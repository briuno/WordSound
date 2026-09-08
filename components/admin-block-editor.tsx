"use client";

import * as React from "react";

import { updateBlock, type ActionResult } from "@/app/admin/actions";
import { Button, ErrorMessage, Field, Input } from "@/components/ui";

/**
 * Editor de conteudo dos blocos.
 *
 * Cada tipo tem uma forma propria no jsonb. O admin digita texto simples e a
 * conversao acontece aqui, nos dois sentidos, para ninguem precisar escrever
 * JSON na mao.
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

/* ------------------------------- conversoes ------------------------------- */

function vocabToText(items: VocabItem[]): string {
  return items.map((i) => [i.word, i.translation, i.example].filter(Boolean).join(" | ")).join("\n");
}

function textToVocab(text: string): VocabItem[] {
  return text
    .split("\n")
    .map((line) => line.split("|").map((s) => s.trim()))
    .filter((parts) => parts[0])
    .map(([word, translation, example]) => ({
      word,
      translation: translation ?? "",
      ...(example ? { example } : {}),
    }));
}

function buildContent(blockType: string, form: HTMLFormElement): Record<string, unknown> {
  const value = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";

  switch (blockType) {
    case "CONTENT":
    case "GRAMMAR":
      return {
        // linha em branco separa paragrafos
        paragraphs: value("paragraphs")
          .split(/\n\s*\n/)
          .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
          .filter(Boolean),
      };
    case "VOCABULARY":
      return { items: textToVocab(value("items")) };
    case "READING":
      return {
        text: value("text").trim(),
        vocabulary: textToVocab(value("vocabulary")).map(({ word, translation }) => ({ word, translation })),
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
}: {
  blockId: number;
  lessonId: number;
  blockType: string;
  title: string | null;
  content: Record<string, unknown>;
  mediaId: number | null;
  audios: { id: number; title: string }[];
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titulo do bloco" htmlFor={`block-title-${blockId}`}>
        <Input id={`block-title-${blockId}`} name="title" defaultValue={title ?? ""} />
      </Field>

      {["CONTENT", "GRAMMAR"].includes(blockType) ? (
        <Field
          label="Paragrafos"
          htmlFor={`paragraphs-${blockId}`}
          hint="Deixe uma linha em branco entre paragrafos."
        >
          <Textarea id={`paragraphs-${blockId}`} name="paragraphs" defaultValue={paragraphs.join("\n\n")} />
        </Field>
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
            <select
              id={`media-${blockId}`}
              name="mediaId"
              defaultValue={mediaId ? String(mediaId) : ""}
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
