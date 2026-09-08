"use client";

import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25] as const;
const BAR_COUNT = 64;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Calcula os picos reais do audio para desenhar a waveform.
 *
 * Decodifica uma vez e reduz a BAR_COUNT barras. Se o navegador nao conseguir
 * decodificar, devolve null e o player cai para um padrao neutro: waveform e
 * enfeite, nunca pode impedir o aluno de ouvir.
 */
async function computePeaks(url: string, signal: AbortSignal): Promise<number[] | null> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();

    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;

    const ctx = new Ctx();
    const audio = await ctx.decodeAudioData(buffer);
    const channel = audio.getChannelData(0);
    const block = Math.floor(channel.length / BAR_COUNT) || 1;

    const peaks: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let max = 0;
      const start = i * block;
      for (let j = start; j < start + block && j < channel.length; j++) {
        const v = Math.abs(channel[j]);
        if (v > max) max = v;
      }
      peaks.push(max);
    }
    void ctx.close();

    const loudest = Math.max(...peaks, 0.01);
    return peaks.map((p) => Math.max(0.08, p / loudest));
  } catch {
    return null;
  }
}

/**
 * Picos ja calculados, por arquivo.
 *
 * A mesma faixa reaparece em cada pergunta que fala dela. Sem isto, trocar de
 * tela baixava o audio inteiro de novo so para redesenhar a mesma waveform, e
 * a barra piscava no padrao neutro no meio do caminho.
 *
 * A chave ignora a query porque a URL do Supabase e assinada e troca de token,
 * o mesmo corte que o service worker faz para achar o audio no cache.
 */
const peaksCache = new Map<string, number[]>();

function peaksKey(url: string): string {
  const cut = url.indexOf("?");
  return cut === -1 ? url : url.slice(0, cut);
}

export function AudioPlayer({
  src,
  title,
  durationHint,
  className,
}: {
  src: string;
  title?: string;
  durationHint?: number | null;
  className?: string;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(durationHint ?? 0);
  const [rate, setRate] = React.useState<number>(1);
  const [volume, setVolume] = React.useState(1);
  // Quem manda na tela e o cache, que sobrevive a troca de etapa. O estado so
  // existe para pedir o rerender quando a decodificacao termina.
  const [decoded, setDecoded] = React.useState<{ key: string; peaks: number[] } | null>(null);
  const key = peaksKey(src);
  const peaks = peaksCache.get(key) ?? (decoded?.key === key ? decoded.peaks : null);

  React.useEffect(() => {
    const key = peaksKey(src);
    if (peaksCache.has(key)) return;
    const controller = new AbortController();
    computePeaks(src, controller.signal).then((result) => {
      if (!result || controller.signal.aborted) return;
      peaksCache.set(key, result);
      setDecoded({ key, peaks: result });
    });
    return () => controller.abort();
  }, [src]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }

  function replay() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play();
  }

  function seekFromClick(event: React.MouseEvent<HTMLButtonElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    el.currentTime = Math.max(0, Math.min(duration, ratio * duration));
  }

  const progress = duration > 0 ? current / duration : 0;
  const bars = peaks ?? Array.from({ length: BAR_COUNT }, (_, i) => 0.35 + 0.3 * Math.sin(i / 2.5));

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-surface p-4",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
      />

      {title ? <p className="mb-3 text-sm font-semibold text-text">{title}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Reproduzir"}
          className="gradient-flow grid size-11 shrink-0 place-items-center rounded-full text-white hover:brightness-110"
        >
          {playing ? <Pause size={18} aria-hidden fill="currentColor" /> : <Play size={18} aria-hidden fill="currentColor" className="ml-0.5" />}
        </button>

        {/* waveform clicavel: funciona como barra de progresso */}
        <button
          type="button"
          onClick={seekFromClick}
          aria-label="Avancar para um ponto do audio"
          className="flex h-12 flex-1 items-center gap-[2px] rounded-lg px-1"
        >
          {bars.map((peak, i) => {
            const played = i / BAR_COUNT <= progress;
            return (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  played ? "bg-brand" : "bg-[var(--border)]",
                )}
                style={{ height: `${Math.round(peak * 100)}%`, minHeight: 3 }}
              />
            );
          })}
        </button>

        <button
          type="button"
          onClick={replay}
          aria-label="Ouvir de novo desde o inicio"
          className="grid size-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <RotateCcw size={17} aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="font-mono text-xs tabular-nums text-text-muted">
          {formatTime(current)} / {formatTime(duration)}
        </p>

        <div className="flex items-center gap-1" role="group" aria-label="Velocidade de reproducao">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRate(s)}
              aria-pressed={rate === s}
              className={cn(
                "rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold transition-colors",
                rate === s ? "bg-brand text-white" : "bg-surface-muted text-text-muted hover:text-text",
              )}
            >
              {s}x
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2 text-text-muted">
          <Volume2 size={15} aria-hidden />
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-20 accent-[var(--color-brand)]"
          />
        </label>
      </div>
    </div>
  );
}
