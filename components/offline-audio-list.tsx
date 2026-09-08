"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";

import { AudioPlayer } from "@/components/audio-player";
import {
  formatBytes,
  listOfflineAudio,
  removeOfflineAudio,
  type OfflineAudio,
} from "@/lib/offline-audio";

/**
 * Os audios que o aluno baixou, prontos para tocar sem internet.
 *
 * O src e a URL sem token: quem responde e o service worker, com o arquivo do
 * cache. Por isso esta lista funciona na pagina offline, onde nada mais alcanca
 * a rede.
 */
export function OfflineAudioList({ emptyHint }: { emptyHint?: string }) {
  const [items, setItems] = React.useState<OfflineAudio[] | null>(null);

  React.useEffect(() => {
    let active = true;
    listOfflineAudio()
      .then((list) => {
        if (active) setItems(list);
      })
      .catch(() => {
        if (active) setItems([]);
      });

    return () => {
      active = false;
    };
  }, []);

  function remove(mediaId: number) {
    setItems((prev) => prev?.filter((i) => i.mediaId !== mediaId) ?? null);
    void removeOfflineAudio(mediaId);
  }

  // enquanto le o cache nao ha nada util a mostrar, e o piscar seria pior
  if (items === null) return null;

  if (items.length === 0) {
    return emptyHint ? <p className="text-sm text-text-muted">{emptyHint}</p> : null;
  }

  const totalBytes = items.reduce((sum, i) => sum + i.bytes, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.mediaId}>
          <div className="mb-1.5 flex items-baseline gap-2">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <span className="truncate text-xs text-text-muted">{item.lessonTitle}</span>
            <button
              type="button"
              onClick={() => remove(item.mediaId)}
              aria-label={`Remover ${item.title}`}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-text-muted hover:bg-surface-muted hover:text-text"
            >
              <Trash2 size={14} aria-hidden />
              Remover
            </button>
          </div>
          <AudioPlayer src={item.url} durationHint={item.durationSeconds} />
        </div>
      ))}
      <p className="text-xs text-text-muted">
        {items.length === 1 ? "1 audio" : `${items.length} audios`} · {formatBytes(totalBytes)} no
        aparelho
      </p>
    </div>
  );
}
