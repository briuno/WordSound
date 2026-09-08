import { FileAudio, Image as ImageIcon } from "lucide-react";
import type { Metadata } from "next";

import { deleteMedia, getMediaLimits, updateMedia } from "@/app/admin/actions";
import { AdminForm, DeleteButton, Disclosure } from "@/components/admin-controls";
import { AudioPlayer } from "@/components/audio-player";
import { MediaUpload } from "@/components/admin-media-upload";
import { Card, EmptyState, Field, Input } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Midia" };

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function AdminMediaPage() {
  const supabase = await createSupabaseServerClient();
  const limits = await getMediaLimits();

  const { data: media } = await supabase
    .from("media")
    .select("id,kind,title,storage_path,mime_type,duration_seconds,size_bytes,transcript,created_at")
    .order("created_at", { ascending: false });

  const list = media ?? [];

  // uma URL assinada por arquivo, so para a previa desta pagina
  const { data: signed } = list.length
    ? await supabase.storage.from("lesson-media").createSignedUrls(
        list.map((m) => m.storage_path),
        60 * 30,
      )
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  // quantos blocos e exercicios dependem de cada arquivo
  const [{ data: blockUses }, { data: exerciseUses }] = await Promise.all([
    supabase.from("lesson_blocks").select("media_id").not("media_id", "is", null),
    supabase.from("exercises").select("media_id").not("media_id", "is", null),
  ]);
  const uses = new Map<number, number>();
  for (const row of [...(blockUses ?? []), ...(exerciseUses ?? [])]) {
    if (row.media_id) uses.set(row.media_id, (uses.get(row.media_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Midia</h1>
        <p className="mt-1 text-sm text-text-muted">
          Audios e imagens das licoes. O bucket e privado: o aluno recebe um link temporario.
        </p>
      </header>

      <Card>
        <Disclosure label="Enviar arquivo" defaultOpen={list.length === 0}>
          <MediaUpload maxBytes={limits.maxBytes} />
        </Disclosure>
      </Card>

      {list.length === 0 ? (
        <EmptyState title="Nenhum arquivo ainda" description="Envie o primeiro audio acima." />
      ) : (
        <ul className="space-y-3">
          {list.map((item) => {
            const url = urlByPath.get(item.storage_path);
            const inUse = uses.get(item.id) ?? 0;
            return (
              <li key={item.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-text-muted">
                      {item.kind === "audio" ? (
                        <FileAudio size={17} aria-hidden />
                      ) : (
                        <ImageIcon size={17} aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{item.title}</span>
                      <span className="block text-xs text-text-muted">
                        {formatSize(item.size_bytes)} · {formatDuration(item.duration_seconds)} ·{" "}
                        {inUse === 0 ? "nao usado" : `usado em ${inUse} lugar(es)`}
                      </span>
                    </span>
                    <span className="ml-auto">
                      {inUse > 0 ? (
                        <span
                          className="text-xs text-text-muted"
                          title="Remova das licoes antes de excluir o arquivo."
                        >
                          em uso
                        </span>
                      ) : (
                        <DeleteButton
                          action={deleteMedia.bind(null, item.id, item.storage_path)}
                          confirmLabel={`o arquivo ${item.title}`}
                        />
                      )}
                    </span>
                  </div>

                  {item.kind === "audio" && url ? (
                    <AudioPlayer
                      src={url}
                      durationHint={item.duration_seconds}
                      className="mt-4 bg-surface-muted/50"
                    />
                  ) : null}

                  {item.kind === "image" && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={item.title}
                      className="mt-4 max-h-56 rounded-xl border border-[var(--border)]"
                    />
                  ) : null}

                  <div className="mt-4">
                    <Disclosure label="Editar dados">
                      <AdminForm action={updateMedia.bind(null, item.id)} submitLabel="Salvar">
                        <Field label="Titulo" htmlFor={`media-title-${item.id}`}>
                          <Input id={`media-title-${item.id}`} name="title" required defaultValue={item.title} />
                        </Field>
                        <Field
                          label="Transcricao"
                          htmlFor={`media-transcript-${item.id}`}
                          hint="Liberada ao aluno so depois que ele responde os exercicios daquele audio."
                        >
                          <textarea
                            id={`media-transcript-${item.id}`}
                            name="transcript"
                            rows={3}
                            defaultValue={item.transcript ?? ""}
                            className="w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-2.5 text-sm text-text"
                          />
                        </Field>
                      </AdminForm>
                    </Disclosure>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
