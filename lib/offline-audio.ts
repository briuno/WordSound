/**
 * Downloads de audio para ouvir sem internet.
 *
 * O arquivo fica no Cache Storage (cache `wordsound-audio`), que e o mesmo
 * lugar de onde o service worker le em public/sw.js. Aqui so escrevemos.
 *
 * A URL assinada do Supabase expira e muda a cada carregamento da pagina, entao
 * a chave do cache e a URL sem a query. O service worker faz o mesmo corte na
 * hora de procurar, e por isso o audio continua sendo encontrado no dia
 * seguinte, com outro token.
 *
 * Um indice paralelo no localStorage guarda titulo, licao e tamanho: o Cache
 * Storage sozinho so sabe responder por URL, e a tela precisa listar o que
 * existe. O indice e sempre conferido contra o cache antes de ser exibido,
 * porque o navegador pode descartar o cache sozinho.
 */

export const AUDIO_CACHE = "wordsound-audio";

const INDEX_KEY = "ws:offline-audio";
const OWNER_KEY = "ws:offline-audio-owner";

export interface DownloadableMedia {
  id: number;
  title: string;
  /** URL assinada, como veio do servidor. */
  url: string;
  durationSeconds: number | null;
}

export interface OfflineAudio {
  mediaId: number;
  /** URL sem a query: e a chave no cache e o src que o player usa. */
  url: string;
  title: string;
  lessonId: number;
  lessonTitle: string;
  durationSeconds: number | null;
  bytes: number;
  savedAt: string;
}

/**
 * Sem service worker no controle nao adianta baixar: quem serve o arquivo
 * guardado e ele. Em desenvolvimento o registro nao acontece, entao a funcao
 * devolve false e a interface de download nem aparece.
 */
export function isOfflineAudioSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "caches" in window &&
    "serviceWorker" in navigator &&
    navigator.serviceWorker.controller !== null
  );
}

/** Chave estavel: a mesma conta que o service worker faz. */
export function stableUrl(signedUrl: string): string {
  const url = new URL(signedUrl);
  url.search = "";
  return url.toString();
}

function readIndex(): OfflineAudio[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as OfflineAudio[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: OfflineAudio[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    // storage cheio ou bloqueado: o audio continua no cache, so a lista se perde
  }
}

/**
 * Lista o que esta baixado de verdade.
 *
 * Confere entrada por entrada contra o cache e reescreve o indice, para a tela
 * nunca oferecer um audio que o navegador ja descartou.
 */
export async function listOfflineAudio(): Promise<OfflineAudio[]> {
  if (!("caches" in window)) return [];

  const cache = await caches.open(AUDIO_CACHE);
  const entries = readIndex();
  const alive: OfflineAudio[] = [];

  for (const entry of entries) {
    if (await cache.match(entry.url)) alive.push(entry);
  }

  if (alive.length !== entries.length) writeIndex(alive);
  return alive.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Todos os audios da licao ja estao no cache? */
export async function isLessonDownloaded(medias: DownloadableMedia[]): Promise<boolean> {
  if (medias.length === 0 || !("caches" in window)) return false;

  const cache = await caches.open(AUDIO_CACHE);
  for (const media of medias) {
    if (!(await cache.match(stableUrl(media.url)))) return false;
  }
  return true;
}

/**
 * Baixa os audios da licao.
 *
 * Pede storage persistente na primeira vez: sem isso o navegador pode limpar o
 * cache quando o disco aperta, justamente o que o aluno nao quer depois de ter
 * baixado de proposito. O pedido e silencioso e pode ser negado.
 */
export async function downloadLessonAudio(
  lesson: { id: number; title: string },
  medias: DownloadableMedia[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  void navigator.storage?.persist?.().catch(() => false);

  const index = readIndex();
  let done = 0;

  for (const media of medias) {
    const key = stableUrl(media.url);
    const response = await fetch(media.url);
    if (!response.ok) throw new Error(`Falha ao baixar ${media.title}`);

    const body = await response.blob();
    await cache.put(
      key,
      new Response(body, {
        headers: {
          "content-type": body.type || "audio/mpeg",
          "content-length": String(body.size),
        },
      }),
    );

    const entry: OfflineAudio = {
      mediaId: media.id,
      url: key,
      title: media.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      durationSeconds: media.durationSeconds,
      bytes: body.size,
      savedAt: new Date().toISOString(),
    };

    const at = index.findIndex((e) => e.mediaId === media.id);
    if (at >= 0) index[at] = entry;
    else index.push(entry);
    // grava a cada arquivo: se o download parar no meio, o que ja desceu
    // continua listado e tocavel
    writeIndex(index);

    done += 1;
    onProgress?.(done, medias.length);
  }
}

/** Apaga um audio. */
export async function removeOfflineAudio(mediaId: number): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const index = readIndex();
  const entry = index.find((e) => e.mediaId === mediaId);
  if (entry) await cache.delete(entry.url);
  writeIndex(index.filter((e) => e.mediaId !== mediaId));
}

/** Apaga tudo que veio de uma licao. */
export async function removeLessonAudio(medias: DownloadableMedia[]): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const ids = new Set(medias.map((m) => m.id));

  for (const media of medias) await cache.delete(stableUrl(media.url));
  writeIndex(readIndex().filter((e) => !ids.has(e.mediaId)));
}

/**
 * Amarra os downloads a uma conta.
 *
 * O bucket e privado por um motivo. Se outro aluno entra no mesmo aparelho, o
 * que o anterior baixou some, em vez de ficar acessivel pela pagina offline.
 */
export async function claimOfflineAudio(userId: string): Promise<void> {
  let previous: string | null = null;
  try {
    previous = localStorage.getItem(OWNER_KEY);
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    return;
  }

  if (previous === userId || previous === null) return;

  writeIndex([]);
  if ("caches" in window) await caches.delete(AUDIO_CACHE);
}

/** "12,4 MB" — tamanho legivel para a interface. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
