"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { createBlock } from "@/app/admin/actions";
import { Button, ErrorMessage } from "@/components/ui";

const BLOCK_TYPES = [
  { type: "CONTENT", label: "Conteudo" },
  { type: "VOCABULARY", label: "Vocabulario" },
  { type: "GRAMMAR", label: "Gramatica" },
  { type: "READING", label: "Reading" },
  { type: "LISTENING", label: "Listening" },
  { type: "EXERCISE", label: "Exercicios" },
] as const;

/** Botoes de "+ Conteudo", "+ Vocabulario" etc. da spec 45. */
export function AddBlockButtons({ lessonId }: { lessonId: number }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function add(type: string, label: string) {
    setError(null);
    startTransition(async () => {
      const result = await createBlock(lessonId, type, label);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, label }) => (
          <Button
            key={type}
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => add(type, label)}
            className="gap-1.5"
          >
            <Plus size={14} aria-hidden />
            {label}
          </Button>
        ))}
      </div>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </div>
  );
}
