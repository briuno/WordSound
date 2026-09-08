"use client";

import { Upload } from "lucide-react";
import * as React from "react";

import { registerMedia } from "@/app/admin/actions";
import { Button, ErrorMessage, Field, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Upload de midia (spec 48 e 49).
 *
 * O arquivo vai do navegador direto para o Storage do Supabase, e so depois a
 * linha e registrada no banco. Passar o binario por uma server action faria o
 * arquivo trafegar duas vezes e esbarraria no limite de corpo da requisicao.
 * A policy de insert do bucket exige admin, entao o caminho segue protegido.
 */

const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/wave", "audio/x-wav"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Le a duracao do audio no proprio navegador, sem depender de biblioteca. */
function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.addEventListener("loadedmetadata", () =>
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration * 100) / 100 : null),
    );
    audio.addEventListener("error", () => done(null));
    audio.src = url;
  });
}

/** Nome seguro e unico, sem acento nem espaco, para virar caminho no bucket. */
function storageKey(file: File): string {
  const clean = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const folder = AUDIO_TYPES.includes(file.type) ? "audio" : "images";
  return `${folder}/${Date.now()}-${clean}`;
}

export function MediaUpload({ maxBytes }: { maxBytes: number }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isAudio = file ? AUDIO_TYPES.includes(file.type) : false;
  const maxMb = Math.round(maxBytes / 1024 / 1024);

  function pick(selected: File | null) {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (![...AUDIO_TYPES, ...IMAGE_TYPES].includes(selected.type)) {
      setError(`Formato nao aceito (${selected.type || "desconhecido"}). Use mp3, m4a, wav, png, jpg ou webp.`);
      setFile(null);
      return;
    }
    if (selected.size > maxBytes) {
      setError(`O arquivo tem ${Math.round(selected.size / 1024 / 1024)} MB e o limite e ${maxMb} MB.`);
      setFile(null);
      return;
    }
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ""));
  }

  async function upload() {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const path = storageKey(file);

      const { error: uploadError } = await supabase.storage
        .from("lesson-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setError(`Falha no upload: ${uploadError.message}`);
        return;
      }

      const duration = isAudio ? await readAudioDuration(file) : null;
      const result = await registerMedia({
        kind: isAudio ? "audio" : "image",
        title,
        storagePath: path,
        mimeType: file.type,
        sizeBytes: file.size,
        durationSeconds: duration,
        transcript,
      });

      if (result.error) {
        // o registro falhou: remove o arquivo para nao virar orfao no bucket
        await supabase.storage.from("lesson-media").remove([path]);
        setError(result.error);
        return;
      }

      setFile(null);
      setTitle("");
      setTranscript("");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Arquivo" htmlFor="media-file" hint={`Ate ${maxMb} MB. mp3, m4a, wav, png, jpg ou webp.`}>
        <input
          ref={inputRef}
          id="media-file"
          type="file"
          accept={[...AUDIO_TYPES, ...IMAGE_TYPES].join(",")}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-2.5 text-sm text-text file:mr-3 file:rounded-full file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-text"
        />
      </Field>

      {file ? (
        <>
          <Field label="Titulo" htmlFor="media-title">
            <Input id="media-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>

          {isAudio ? (
            <Field
              label="Transcricao"
              htmlFor="media-transcript"
              hint="O aluno so ve depois de responder os exercicios daquele audio."
            >
              <textarea
                id="media-transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-2.5 text-sm text-text"
              />
            </Field>
          ) : null}
        </>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <Button onClick={upload} disabled={!file || busy || title.trim().length < 2} className="gap-2">
        <Upload size={16} aria-hidden />
        {busy ? "Enviando…" : "Enviar arquivo"}
      </Button>
    </div>
  );
}
